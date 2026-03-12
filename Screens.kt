package com.appzyro.shiftmaster.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.appzyro.shiftmaster.service.NotificationHelper
import com.appzyro.shiftmaster.ui.theme.ShiftMasterTheme

sealed class Screen(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Schedule : Screen("schedule", "Schedule", Icons.Default.CalendarMonth)
    object Request : Screen("request", "Request", Icons.Default.AddCircle)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)
}

val SHIFT_COLORS = mapOf(
    "A" to Color(0xFF3B82F6), // Blue
    "B" to Color(0xFFF97316), // Orange
    "C" to Color(0xFFA855F7), // Purple
    "G" to Color(0xFFFFC107), // Sunlight Yellow
    "Leave" to Color(0xFFEF4444), // Red
    "None" to Color(0xFF64748B)  // Slate
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp() {
    val navController = rememberNavController()
    val items = listOf(Screen.Dashboard, Screen.Schedule, Screen.Request, Screen.Settings)

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            ) {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                items.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = null) },
                        label = { Text(screen.label) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Dashboard.route) { DashboardScreen() }
            composable(Screen.Schedule.route) { ScheduleScreen() }
            composable(Screen.Request.route) { RequestScreen() }
            composable(Screen.Settings.route) { SettingsScreen() }
        }
    }
}

@Composable
fun DashboardScreen() {
    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("Shift Master", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
            Text("Shifts in Motion, Records in Control.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(24.dp))
            
            Text("Today's Shift", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))
            
            // Today's Shift Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SHIFT_COLORS["A"]!!),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("Shift A", color = Color.white, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    Text("6:00 AM – 2:00 PM", color = Color.white.copy(alpha = 0.8f))
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            Text("Upcoming Shifts", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            
            // Upcoming Shifts List
            listOf("Tomorrow", "Friday", "Saturday").forEach { day ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(12.dp).background(SHIFT_COLORS["B"]!!, RoundedCornerShape(2.dp)))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(day, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.weight(1f))
                        Text("Shift B", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        
        // Rule 1: Banner Ad at the bottom
        Box(modifier = Modifier.align(Alignment.BottomCenter)) {
            BannerAd(adUnitId = AdUnitIds.DASHBOARD_BANNER)
        }
    }
}

@Composable
fun ScheduleScreen() {
    val context = LocalContext.current
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf("") }
    var selectedShift by remember { mutableStateOf("A") }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Shift Schedule", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                IconButton(onClick = { showAddDialog = true }) {
                    Icon(Icons.Default.Add, contentDescription = "Add Shift")
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            
            // Simple Calendar Placeholder
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("March 2026", fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Calendar View Placeholder", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            Text("Shift Timings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            
            listOf(
                "Shift A" to "6:00 AM – 2:00 PM",
                "Shift B" to "2:00 PM – 10:00 PM",
                "Shift C" to "10:00 PM – 6:00 AM",
                "Shift G" to "9:00 AM – 6:00 PM"
            ).forEach { (name, time) ->
                Row(modifier = Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(8.dp).background(SHIFT_COLORS[name.takeLast(1)]!!, RoundedCornerShape(2.dp)))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(name, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(time, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        if (showAddDialog) {
            AlertDialog(
                onDismissRequest = { showAddDialog = false },
                title = { Text("Add Shift") },
                text = {
                    Column {
                        OutlinedTextField(
                            value = selectedDate,
                            onValueChange = { selectedDate = it },
                            label = { Text("Date (yyyy-MM-dd)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Select Shift Type:")
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            listOf("A", "B", "C", "G").forEach { shift ->
                                FilterChip(
                                    selected = selectedShift == shift,
                                    onClick = { selectedShift = shift },
                                    label = { Text(shift) }
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        if (selectedDate.isNotEmpty()) {
                            NotificationHelper.scheduleShiftReminderByDate(
                                context,
                                selectedDate,
                                selectedShift
                            )
                            showAddDialog = false
                        }
                    }) {
                        Text("Save & Set Reminder")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showAddDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun RequestScreen() {
    val context = LocalContext.current
    val activity = context as? Activity
    val adManager = remember { InterstitialAdManager(context) }
    
    LaunchedEffect(Unit) {
        adManager.loadAd()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("Overtime Request", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(24.dp))
            
            OutlinedTextField(
                value = "",
                onValueChange = {},
                label = { Text("Date") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = "",
                onValueChange = {},
                label = { Text("Hours") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = {
                    // Simulate success and show ad
                    if (activity != null) {
                        adManager.showAd(activity) {
                            Log.d("RequestScreen", "Ad handled, request submitted")
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Submit Request", modifier = Modifier.padding(8.dp))
            }
        }
    }
}

@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    
    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            item {
                Text("Settings", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(24.dp))
            }
            
            item {
                Text("Profile", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                ListItem(
                    headlineContent = { Text("Alex Rivera") },
                    supportingContent = { Text("Tap to edit name") },
                    leadingContent = { Icon(Icons.Default.Person, null) }
                )
                HorizontalDivider()
            }
            
            item {
                Text("Preferences", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                ListItem(
                    headlineContent = { Text("Notifications") },
                    trailingContent = { Switch(checked = true, onCheckedChange = {}) },
                    leadingContent = { Icon(Icons.Default.Notifications, null) }
                )
                
                // Shift Reminders Section
                Text("Reminders", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 16.dp))
                
                var showBatteryDialog by remember { mutableStateOf(false) }
                val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                val isIgnoringBatteryOptimizations = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    powerManager.isIgnoringBatteryOptimizations(context.packageName)
                } else true

                if (!isIgnoringBatteryOptimizations) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                "Battery Optimization Warning",
                                style = MaterialTheme.typography.titleSmall,
                                color = MaterialTheme.colorScheme.error
                            )
                            Text(
                                "For reliable shift reminders please allow Shift Master to ignore battery optimization.",
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                            Button(
                                onClick = {
                                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                            data = Uri.parse("package:${context.packageName}")
                                        }
                                        context.startActivity(intent)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                            ) {
                                Text("Disable Optimization")
                            }
                        }
                    }
                }

                ListItem(
                    headlineContent = { Text("Test Reminder") },
                    supportingContent = { Text("Triggers a notification in 10 seconds") },
                    leadingContent = { Icon(Icons.Default.Timer, null) },
                    onClick = {
                        NotificationHelper.testReminder(context)
                    }
                )
                
                HorizontalDivider()
            }
            
            item {
                Text("Support", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                ListItem(
                    headlineContent = { Text("Share App") },
                    onClick = {
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, "Check out Shift Master: https://appzyro.com/shift-master")
                        }
                        context.startActivity(Intent.createChooser(intent, "Share via"))
                    },
                    leadingContent = { Icon(Icons.Default.Share, null) }
                )
                ListItem(
                    headlineContent = { Text("Privacy Policy") },
                    leadingContent = { Icon(Icons.Default.Shield, null) }
                )
                ListItem(
                    headlineContent = { Text("About") },
                    supportingContent = { Text("Version 1.2.0") },
                    leadingContent = { Icon(Icons.Default.Info, null) }
                )
                HorizontalDivider()
            }
            
            item {
                Spacer(modifier = Modifier.height(24.dp))
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("Developed by Appzyro", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Version 1.2.0", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f))
                }
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
        
        // Rule 4: Banner Ad at bottom of Settings
        Box(modifier = Modifier.align(Alignment.BottomCenter)) {
            BannerAd(adUnitId = AdUnitIds.SETTINGS_BANNER)
        }
    }
}
