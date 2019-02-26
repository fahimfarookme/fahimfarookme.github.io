---
layout: post
title: The Mystery of Eureka self-preservation
description: A story about the mysteries of Netflix Eureka self-preservation
tags: [migrated, microservices, eureka, spring-cloud, monitoring]
image:
---

Eureka is an AP system in terms of CAP theorem which in turn makes the information in the registry inconsistent between the servers of a zone, during a network partition. The self-preservation feature is an effort to minimize this inconsistency.

## Defining self-preservation
Self-preservation is a feature where Eureka servers stop expiring the client instances from the registry when they do not receive heartbeats (from peers and client microservices) beyond a certain threshold.

Let's try to understand this concept in detail.

### A healthy system to start with
Consider the following healthy system.

{% include image.html src="/img/eureka-before-network-partition.png" description="The healthy system - before encountering any network partitions" style="width: 758px;" %}

Suppose that all the microservices are healthy and registered with the Eureka server 1. In case if you are wondering why, that's because Eureka clients register with and send heartbeats only to the very first server configured in `service-url` list. i.e.

```properties
eureka.client.service-url.defaultZone=server1,server2
```

Eureka servers replicate the registry information with adjacent peers and the registry indicates that all the microservice instances are in `UP` state. Also suppose that instance 2 used to invoke instance 4 after discovering it from the Eureka registry.


### Encountering a network partition
Assume a network partition had happened and the system has been transitioned to the following state.

{% include image.html src="/img/eureka-during-network-partition.png" description="The system during a network partition - Eureka servers enter the self-preservation mode" style="width: 758px;" %}

Due to the network partition instance 4 and 5 lost connectivity with the Eureka server, however instance 2 is still having connectivity to instance 4. The Eureka server will then evict instance 4 and 5 from the registry since the server no longer receive heartbeats. Then it will start to observe that it has lost more than 15% of the heartbeats suddenly and consequently enter the self-preservation mode.

From now onward the Eureka server stops expiring instances in the registry even if remaining instances go down.

{% include image.html src="/img/eureka-during-self-preservation.png" description="The system during the self-preservation mode - Eureka servers stop expiring any microservice instances"  style="width: 599px;"%}

Instance 3 has gone down, but it remains in active state in the server registry. However the Eureka servers accept new registrations.


## The rationale behind self-prservation
The self-preservation feature can be justified for the following two reasons.

- Servers not receiving heartbeats could be due to a poor network partition (i.e. does not      necessarily mean the clients are down) which could be resolved sooner.
- Even though the connectivity is lost between the server and some clients, clients might still have connectivity to each other. i.e. Instance 2 is having connectivity to instance 4 during the network partition as in the above diagram.

## Configurations (with defaults)
Listed below are the configurations that can directly or indirectly impact self-preservation behavior.


```properties
eureka.instance.lease-renewal-interval-in-seconds=30
```

Indicates the frequency the client sends heartbeats to server to indicate that it is still alive. It's not advisable to change this value since self-preservation assumes that the heartbeats are always received at intervals of 30 seconds.


```properties
eureka.instance.lease-expiration-duration-in-seconds=90
```

Indicates the duration the server waits since it received the last heartbeat before it can evict an instance from its registry. This value should be greater than `lease-renewal-interval-in-seconds`. Setting this value to a too large number impacts the precision of actual heartbeats per minute calculation described in the next section, since the liveliness of the registry is dependent on this value. Setting this value to a too small number could make the system intolerable to temporary network glitches.

```properties
eureka.server.eviction-interval-timer-in-ms=60*1000
```

A scheduler is run at this frequency which will evict instances from the registry if the lease of the instances are expired as configured by `lease-expiration-duration-in-seconds`. Setting this value to a too large number will delay the system entering into self-preservation mode.

```properties
eureka.server.renewal-percent-threshold=0.85
```

This value is used to calculate the expected heartbeats per minute as described in the next section.

```properties
eureka.server.renewal-threshold-update-interval-ms=15*60*1000
```

A scheduler is run at this frequency which calculates the expected heartbeats per minute as described in the next section.

```properties
eureka.server.enable-self-preservation=true
```

Last but not least, self-preservation can be disabled if required.


## Making sense of configurations
Eureka server enters self-preservation mode if the *actual number of heartbeats in last minute* is less than the *expected number of heartbeats per minute*.

### Expected number of heartbeats per minute
We can see the means of calculating expected number of heartbeats per minute threshold. Netflix code assumes that heartbeats are always received at intervals of 30 seconds for this calculation.

Suppose the number of registered application instances at some point in time is `N` and the configured `renewal-percent-threshold` is `0.85`.

- Number of heartbeats expected from one instance / min = 2
- Number of heartbeats expected from N instances / min = 2 <nowiki>*</nowiki> N
- Expected minimum heartbeats / min = **2 <nowiki>*</nowiki> N <nowiki>*</nowiki> 0.85**

Since N is a variable, 2 <nowiki>*</nowiki> N <nowiki>*</nowiki> 0.85 is calculated in every 15 minutes by default (or in every `renewal-threshold-update-interval-ms`).


### Actual number of heartbeats in last minute
This is calculated by a scheduler which runs in a frequency of one minute.

Also as describe above, two schedulers run independently in order to calculate *actual* and *expected* number of heartbeats. However it's an additional scheduler, `EvictionTask`, which does the comparison of these two values and identifies whether the system is in self-preservation mode or not. This scheduler runs in a frequency of `eviction-interval-timer-in-ms` and evicts expired instances, however it checks whether the system has reached self-preservation mode (by comparing actual and expected heartbeats) before evicting.

The eureka dashboard also does this comparison every time when you launch it in order to display the message *…INSTANCES ARE NOT BEING EXPIRED JUST TO BE SAFE*.


## Conclusion
- My experience with self-preservation is that it's a *false-positive* most of the time where it incorrectly assumes a few down microservice instances to be a poor network partition.
- Self-preservation never expires, until and unless the down microservices are brought back (or the network glitch is resolved).
- If self-preservation is enabled, we cannot fine-tune the instance heartbeat interval, since self-preservation always assumes heartbeats are received at intervals of 30 seconds.
- Unless these kinds of network glitches are common in your environment, I would suggest to turn it off (even though most people recommend to keep it on).