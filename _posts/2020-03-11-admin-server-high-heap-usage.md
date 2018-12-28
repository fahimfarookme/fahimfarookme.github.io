---
layout: post
title: High heap utilization
description: A tale of a gc log
tags: [root-cause-analysis, weblogic, gc-log]
image:
---

Whenever the heap utlization goes over 90%, a red alert is issued by the production monitoring system. This time, however its over the admin server, so little less panic.


## Analysis

It's about heap utilization, so the most sensible logs to look at are the gc-logs and heap dumps. Transferring heap dumps takes time, hence I started analyzing the gc-log of the admin server.


