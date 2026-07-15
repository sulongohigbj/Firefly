---
title: Android 版本代号、版本号与 API 级别速查
published: 2026-07-15
tags: [Android, API, 版本号]
category: 刷机
draft: false
---

Android 的版本信息看起来很杂，尤其是“代号、版本号、API 级别、NDK 版本”这几个概念放在一起时，很多人会一下子搞混。对开发者来说，最重要的其实不是死记硬背，而是建立一套直观的对应关系。

## 先说结论

如果你只是想快速看懂一台 Android 设备或一个项目的兼容性，最值得关注的通常是这三个信息：

- 代号：例如 Android 13 对应 Tiramisu
- 版本号：例如 13、14、15
- API 级别：这是开发和适配时最重要的标准

简单来说，代号更像“外号”，版本号是正式编号，而 API 级别才是程序员真正要使用的“开发标准”。

## 版本代号、版本号、发布时间与 API 级别对照

下面这张表可以作为一个比较实用的速查表：

| 安卓版本 | API 级别/NDK 版本 | 代号 | 发布时间 |
| --- | --- | --- | --- |
| Android 17 | 37.0, 37.1 | 代号 Cinnamon Bun | 2026-06-17 |
| Android 16 | 36.0, 36.1 | 代号 Baklava | 2025-06-10 |
| Android 15 | 35 | 代号 Vanilla Ice Cream | 2024-09-03 |
| Android 14 | 34 | 代号 Upside Down Cake | 2023-10-04 |
| Android 13 | 33 | 代号 Tiramisu | 2022-08-15 |
| Android 12L | 32 | 代号 Sv2 | 2022-03-07 |
| Android 12 | 31 | 代号 Snow Cone | 2021-10-04 |
| Android 11 | 30 | 代号 Red Velvet | 2020-09-08 |
| Android 10 | 29 | 代号 Q | 2019-09-03 |
| Android 9 | 28 | 代号 Pie | 2018-08-06 |
| Android 8.1 | 27 | 代号 Oreo | 2017-12-05 |
| Android 8.0 | 26 | 代号 Oreo | 2017-08-21 |
| Android 7.1 | 25 | 代号 Nougat | 2016-12-05 |
| Android 7.0 | 24 | 代号 Nougat | 2016-08-22 |
| Android 6.0 | 23 | 代号 Marshmallow | 2015-09-29 |
| Android 5.1 | 22 | 代号 Lollipop | 2015-03-02 |
| Android 5.0 | 21 | 代号 Lollipop | 2014-11-12 |
| Android 4.4 | 19 | 代号 KitKat | 2013-09-03 |
| Android 4.3 | 18 | 代号 Jelly Bean | 2013-07-24 |
| Android 4.2 | 17 | 代号 Jelly Bean | 2012-11-13 |
| Android 4.1 | 16 | 代号 Jelly Bean | 2012-07-09 |
| Android 4.0 | 15 | 代号 Ice Cream Sandwich | 2011-11-14 |
| Android 3.2 | 13 | 代号 Honeycomb | 2011-07-15 |
| Android 3.1 | 13 | 代号 Honeycomb | 2011-05-10 |
| Android 3.0 | 11 | 代号 Honeycomb | 2011-02-22 |
| Android 2.3 | 9 | 代号 Gingerbread | 2010-12-06 |
| Android 2.2 | 8 | 代号 Froyo | 2010-05-20 |
| Android 2.1 | 7 | 代号 Eclair | 2010-01-11 |
| Android 2.0 | 5, 6 | 代号 Eclair | 2009-10-27 |
| Android 1.6 | 4 | 代号 Donut | 2009-09-15 |
| Android 1.5 | 3 | 代号 Cupcake | 2009-04-27 |
| Android 1.1 | 2 | 代号 Petit Four | 2009-02-09 |
| Android 1.0 | 1 | 代号 | 2008-09-23 |


## NDK 版本是什么

NDK 主要是给原生开发使用的工具包，通常和 C/C++ 代码、JNI、系统库调用有关。对于普通应用开发来说，很多人更常接触到的是 API 级别，但如果你在做 So 库、原生模块或者跨平台调用，NDK 的版本也会变得很重要。

早期 Android 的 NDK 版本和 API 级别之间有明显的对应关系，尤其是 1.5 到 4.0 这一段。到了后续版本，NDK 的更新节奏和 API 级别已经不再完全一一对应，所以日常开发中更常关注的是：

- 你使用的 Android SDK 版本
- 目标设备的系统版本
- 项目所需的最小兼容版本

## 为什么 build ID 也值得了解

如果你接触过刷机、源码编译或者系统定制，就会经常看到 build ID。Android 8.0 及以上的系统，build ID 的格式通常类似：

```text
PVBB.YYMMDD.bbb[.Cn]
```

其中：

- P：平台版本代号的首字母
- V：分支类型
- BB：分支代码
- YYMMDD：开发分支同步或分支切出的日期
- bbb：同一天内不同 build 的序号
- Cn：补丁版本标记

对普通用户来说，这个信息看起来有点“像源码内部编号”，但对于刷机、定位版本和排查问题，还是很有价值的。

## 开发时最该关注什么

如果你是做 Android 应用开发，真正应该重点记住的并不是一大串代号，而是这几点：

1. 你的项目目标版本是多少
2. 你要兼容到哪个最小版本
3. 你打算使用哪些新特性
4. 你是否需要适配不同厂商的系统差异

对于大多数人来说，记住 API 级别和 targetSdkVersion 就已经足够了。因为它们直接影响到应用能不能正常运行、能不能获得新的系统能力，以及是否需要做兼容处理。

## 最后的一句话

Android 的版本体系看起来复杂，但本质上就是一套“代号、正式版本、API 级别、构建编号”叠加起来的系统。只要你把它拆开看，理解起来其实并没有想象中那么难。

如果你也在折腾 Android、刷机、适配或者开发应用，这张对应关系会比单纯看一堆数字更实用。
