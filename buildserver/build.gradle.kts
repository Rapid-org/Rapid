import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.5.31")
    }
}
plugins {
    id("org.springframework.boot") version "2.5.2"
    id("io.spring.dependency-management") version "1.0.11.RELEASE"
    java
    application
    kotlin("jvm") version "1.6.0-RC"
}
apply(plugin = "application")
apply(plugin = "kotlin")
group = "io.mohamed"
version = "0.0.1"

application {
    mainClass.set("io.mohamed.rapid.buildserver.BuildServer")
}

repositories {
    mavenCentral()
    google()
    flatDir {
        dirs("lib")
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.zeroturnaround:zt-zip:1.14")
    implementation("commons-io:commons-io:2.11.0")
    implementation("com.android.tools:r8:2.2.64")
    implementation(":AnnotationProcessors")
    implementation(":AndroidRuntime")
    implementation(":kawa")
    implementation(":proguard")
    implementation(":android")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.5.31")
    implementation("io.github.classgraph:classgraph:4.8.128")
    implementation("com.thoughtworks.paranamer:paranamer:2.8")
    implementation("org.jsoup:jsoup:1.14.3")
}

val compileKotlin: KotlinCompile by tasks
val compileTestKotlin: KotlinCompile by tasks

compileKotlin.kotlinOptions {
    jvmTarget = "1.8"
}
compileTestKotlin.kotlinOptions {
    jvmTarget = "1.8"
}