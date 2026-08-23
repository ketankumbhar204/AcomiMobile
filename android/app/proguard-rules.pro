# ACOMI release ProGuard / R8 rules.
# minifyEnabled is currently false (see android/app/build.gradle).
# These rules apply when enableProguardInReleaseBuilds is set to true.
# Do not use -keep class ** { *; }.

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Reanimated / Worklets (JNI + New Architecture)
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }

# Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# SVG
-keep public class com.horcrux.svg.** { *; }

# Image picker FileProvider
-keep class com.imagepicker.** { *; }

# Blur view
-keep class com.reactnativecommunity.blurview.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# OkHttp / Okio (React Native networking)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }
