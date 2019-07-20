---
layout: post
title: Inversion of Control Distilled
description: Making sense of IoC
tags: [design-principals, opinions]
image:
---

Inversion of Control (IoC) is a simple, yet vastly misinterpreted concept which many get  confused with Dependency Injection (DI).

## Hidden keywords
Though it literally means an inversion of *some* control, the phrase IoC isn't explicit enough to say what exact *control* that it inverts. IoC would actually mean *Inversion of <span style="color: {{- site.data.theme.color.primary -}}">Ownership</span> of Control<span style="color: {{- site.data.theme.color.primary -}}">-flow</span>* which I have explained in detail below.

## Problem
Control-flow is the order in which the individual functions are executed. In a usual program control-flow is determined by the program (or functions of the program) itself where functions call each other starting from the `main()` function. 

{% include image.html src="/img/ioc-functions-calling-each-other.png" description="Functions themselves are calling each other to manage the control-flow" style="" %}

A program with such a design suffers from the following deficiencies which effectively make the functions not reusable in different contexts.

- Violates the *single responsibility principal* since the functions hold the additional responsibility of deciding & invoking the subsequent function.
  
- Tight coupling between the functions.


## Solution
IoC suggests that some additional *framework* should own the control-flow of the program there by promoting the reusability of individual functions.

{% include image.html src="/img/ioc-framework-calling-function.png" description="Framework is calling the functions to manage the control-flow" style="" %}

As in the above diagram, now the framework holds the responsibility of calling the functions in the required sequence and the functions are agnostic of each other.	 


## IoC at different abstractions
IoC can be realized at different abstractions; the above example was on a procedural programming context.

- In object oriented paradigm, applications are concerned with object creation and managing the relationships between the objects as well, apart from the control-flow. As with procedural paradigm, objects knowing other concrete objects will make them less reusable and suffer from from the same deficiencies. Such applications require a special kind of framework called a *container* which is responsible for object creation, object life-cycle & relationships. These containers, *aka Dependency Injection Frameworks*, inject dependencies of the application objects thereby eliminating application objects from creating other concrete object.

{% include image.html src="/img/ioc-dependency-injection-container.png" style="" %}

- In distributed systems, the problem of distributed transactions are solved by *orchestrators* (i.e. sagas) which will coordinate between the processes, thereby eliminating the processes from calling each other directly.

{% include image.html src="/img/ioc-microservice-orchestrator.png" style="" %}





