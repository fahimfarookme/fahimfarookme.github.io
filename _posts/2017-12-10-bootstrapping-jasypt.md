---
layout: post
title: Bootstrapping Jasypt
description: Making Jasypt cloud-ready
tags: [migrated, microservices, spring-cloud, jasypt, config-server, bootstrapping]
image:
---

Recently, one of my juniors was facing an issue with encrypted passwords in Spring config server. This post is to discuss about that issue and how the issue was resolved.

## Background
Spring cloud defines a [*Bootstrap phase*](http://cloud.spring.io/spring-cloud-static/spring-cloud.html#_the_bootstrap_application_context) wherein it creates a context from configurations in the `boostrap.properties` (or .yml) file. The `boostrap.properties` file is usually packaged in  microservices (i.e. config clients) and having following 2 configurations.

```properties
spring.application.name=microservice-x
spring.cloud.config.uri=http://host-y:8888/
```

During the bootstrap phase the `microservice-x` will retrieve properties from the config server running at the endpoint `http://host-y:8888/` and then constructs the beans.

The config server however doesn't have a bootstrap phase (typical case) and having following properties in its `application.properties`.

```properties
spring.application.name=config-server
spring.cloud.config.server.git.uri=https://github.com/fahimfarookme/config-repo
```

But what if the config repository is a protected one? The credentials should also be configured.

```properties
spring.cloud.config.server.git.username=myusername@somewhere.com
spring.cloud.config.server.git.password=mypassword
```

However it's a security vulnerability to keep passwords in plain text. Now that Jasypt comes to rescue. Let's encrypt the password with Jasypt and the final `application.properties` would look like this;

```properties
spring.application.name=config-server
spring.cloud.config.server.git.uri=https://github.com/fahimfarookme/config-repo
spring.cloud.config.server.git.username=myusername@somewhere.com
spring.cloud.config.server.git.password=ENC(VMAckVbiEpU1pGpcZoow=)
jasypt.encryptor.algorithm=PBEWithMD5AndDES
jasypt.encryptor.password=passphrase
```

We've configured the encryption algorithm and the symmetric key as well above. Also we might have to secure the [`jasypt.encryptor.password`](https://stackoverflow.com/questions/8357868/how-do-i-securely-store-encryption-keys-in-java) which is out of the scope for this post.

So far, so good!


## Issue
Sometimes it's required to bootstrap the config-server itself. i.e. the config server should configure its beans from the properties fetched from the remote repository. In our case we extended the config server with a dashboard - which was dependent on some environment specific configurations from the remote repository.

[Let's bootstrap the config server](https://cloud.spring.io/spring-cloud-config/multi/multi__embedding_the_config_server.html) by introducing a `bootstrap.properties` file. The configurations in this file are similar to `application.properties` file above, except the instruction to bootstrap.

```properties
# bootstrap the config server.
spring.cloud.config.server.bootstrap=true
# same as application.properties before.
spring.application.name=config-server
spring.cloud.config.server.git.uri=https://github.com/fahimfarookme/config-repo
spring.cloud.config.server.git.username=myusername@somewhere.com
spring.cloud.config.server.git.password=ENC(VMAckVbiEpU1pGpcZoow=)
jasypt.encryptor.algorithm=PBEWithMD5AndDES
jasypt.encryptor.password=passphrase
```

This will introduce a bootstrap phase for config server during which it will try to pull configurations from the remote repository. However the password for config repository is encrypted with Jasypt and *Jasypt decrypts properties only at a later stage* (post bootstrap phase).

I could see the following exception in the logs.

```
Caused by: org.eclipse.jgit.errors.TransportException: https://github.com/fahimfarookme/config-repo: not authorized
```


## Analysis
The bootstrap context is created from the sources defined under `BootstrapConfiguration` in the `spring.factories`. The `spring-cloud-context` defines following `BootstrapConfiguration` in it's `spring.factories`.

```properties
org.springframework.cloud.bootstrap.BootstrapConfiguration=\
org.springframework.cloud.bootstrap.config.PropertySourceBootstrapConfiguration
```

The `PropertySourceBootstrapConfiguration` is an `ApplicationContextInitializer` which tries to pull configurations from the remote config repository during initialization. It also uses the credentials provided in order to establish the connection with the remote repository. Also it's having the order of `Ordered.HIGHEST_PRECEDENCE + 10`.

Jasypt on the other hand defines an auto-configuration in it's `spring.factories`.

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.ulisesbocchio.jasyptspringboot.JasyptSpringBootAutoConfiguration
```

This configuration class defines `EnableEncryptablePropertiesBeanFactoryPostProcessor` which is a `BeanFactoryPostProcessor` and is responsible for decrypting encrypted text in the property files. Also it's having the order of `Ordered.LOWEST_PRECEDENCE`.

However this `BeanFactoryPostProcessor` is initialized only after the bootstrap phase - hence, by the time the config server (i.e. `PropertySourceBootstrapConfiguration`) is trying to pull the configurations from the remote config repository, it doesn't have the decrypted password.


## Solution
As the solution, we need Jasypt to decrypt encrypted properties before config-server starts pulling configurations from config repository.

How about changing the order of `EnableEncryptablePropertiesBeanFactoryPostProcessor` to `Ordered.HIGHEST_PRECEDENCE + 11`? Well, that won't work because the child context `JasyptSpringBootAutoConfiguration` itself is constructed at a later stage.

The solution I proposed was to *bootstrap Jasypt in a spring cloud based environment*. Checkout this [pull request](https://github.com/ulisesbocchio/jasypt-spring-boot/pull/67). The solution in brief is to define a new `BootstrapConfiguration` in `spring.factories` of Jasypt which is similar to `JasyptSpringBootAutoConfiguration` so that `EnableEncryptablePropertiesBeanFactoryPostProcessor` is initialized during the bootstrap phase. However it's not required to redefine this `BeanFactoryPostProcessor` with a higher priority because post-processing of bean factories happen prior to initializing Initializers. i.e. `EnableEncryptablePropertiesBeanFactoryPostProcessor#postProcessBeanFactory()` is invoked before `PropertySourceBootstrapConfiguration#initialize()` anyways.

```properties
org.springframework.cloud.bootstrap.BootstrapConfiguration=\
com.ulisesbocchio.jasyptspringboot.JasyptSpringCloudBootstrapConfiguration
```

```java
@Configuration
@ConditionalOnClass(name = "org.springframework.cloud.bootstrap.BootstrapApplicationListener")
@ConditionalOnProperty(name = "spring.cloud.bootstrap.enabled", havingValue = "true", matchIfMissing = true)
public class JasyptSpringCloudBootstrapConfiguration {

	 @Configuration
	 @ConditionalOnProperty(name = "jasypt.encryptor.bootstrap", havingValue = "true", matchIfMissing = true)
	 @Import(EnableEncryptablePropertiesConfiguration.class)
	 protected static class BootstrappingEncryptablePropertiesConfiguration {

	 }
}
```

`@ConditionalOnClass("BootstrapApplicationListener")` is to make sure that this configuration will be effective in spring cloud based environments only. However since bootstrap phase can be turned off by `spring.cloud.bootstrap.enabled=false` configuration, `@ConditionalOnProperty("spring.cloud.bootstrap.enabled" ...)` ensures that it's not the case. I also provided an additional `jasypt.encryptor.bootstrap` property in order to allow disabling the *Jasypt-bootstrapping* process altogether, in which case Jasypt will be auto-configured as usual.