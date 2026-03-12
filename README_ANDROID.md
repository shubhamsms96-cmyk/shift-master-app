# Shift Master - Android Project Structure

To build this as a native Android app, you can use **Android Studio** with **Kotlin** and **Jetpack Compose**. Below is the recommended project structure and key files.

## Project Structure
```
ShiftMaster/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/appzyro/shiftmaster/
│   │   │   │   ├── data/
│   │   │   │   │   ├── AppDatabase.kt (Room)
│   │   │   │   │   ├── ShiftDao.kt
│   │   │   │   │   └── UserProfile.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── DashboardScreen.kt
│   │   │   │   │   ├── ScheduleScreen.kt
│   │   │   │   │   ├── RequestScreen.kt
│   │   │   │   │   └── SettingsScreen.kt
│   │   │   │   ├── service/
│   │   │   │   │   └── NotificationService.kt
│   │   │   │   └── MainActivity.kt
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   ├── build.gradle
├── build.gradle
└── settings.gradle
```

## Key Android Files

### 1. AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.READ_CALENDAR" />
    <uses-permission android:name="android.permission.WRITE_CALENDAR" />
    
    <application
        android:name=".ShiftMasterApp"
        android:icon="@mipmap/ic_launcher"
        android:label="Shift Master"
        android:theme="@style/Theme.ShiftMaster">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 2. Database (Room) - ShiftDao.kt
```kotlin
@Dao
interface ShiftDao {
    @Query("SELECT * FROM shifts WHERE date = :date")
    suspend fun getShiftForDate(date: String): Shift?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShift(shift: Shift)
}
```

## AdMob Integration

The app is now integrated with Google AdMob for monetization.

### AdMob Configuration
- **App ID:** `ca-app-pub-1831617002289210~5623424661`
- **Banner Ad Unit ID:** `ca-app-pub-1831617002289210/4901699501`
- **Interstitial Ad Unit ID:** `ca-app-pub-1831617002289210/3588617839`

### Ad Placement Rules
1. **Dashboard:** Banner Ad at the bottom.
2. **Schedule:** No ads.
3. **Request:** Interstitial Ad shown after successful overtime request submission.
4. **Settings:** Small Banner Ad at the bottom.

### Implementation Details
- **SDK:** `com.google.android.gms:play-services-ads:23.0.0`
- **Initialization:** `MobileAds.initialize()` is called in `MainActivity` using a background coroutine to ensure smooth app startup.
- **Banner Ads:** Implemented using `AndroidView` to wrap the native `AdView` in Jetpack Compose.
- **Interstitial Ads:** Managed by `InterstitialAdManager` which handles background loading and showing the ad with a callback for seamless user flow.

## Build Commands

### APK Build
```bash
./gradlew assembleDebug
```

### Play Store (Release Bundle)
```bash
./gradlew bundleRelease
```

## Step-by-Step Build Instructions
1. Open **Android Studio**.
2. Create a new project with **Empty Compose Activity**.
3. Add dependencies for **Room**, **Navigation Compose**, and **Material 3** in `build.gradle`.
4. Implement the UI using the provided designs (use `Card`, `LazyRow`, and `BottomNavigation`).
5. Use `WorkManager` for daily shift reminders.
6. Use `CalendarContract` API for device calendar sync.
