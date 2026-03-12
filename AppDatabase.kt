package com.appzyro.shiftmaster.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "shifts")
data class Shift(
    @PrimaryKey val date: String, // yyyy-MM-dd
    val shiftType: String // A, B, C, Leave, None
)

@Entity(tableName = "overtime")
data class Overtime(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val date: String,
    val hours: Double
)

@Dao
interface ShiftDao {
    @Query("SELECT * FROM shifts")
    fun getAllShifts(): Flow<List<Shift>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShift(shift: Shift)

    @Query("SELECT * FROM overtime")
    fun getAllOvertime(): Flow<List<Overtime>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOvertime(overtime: Overtime)
}

@Database(entities = [Shift::class, Overtime::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun shiftDao(): ShiftDao
}
