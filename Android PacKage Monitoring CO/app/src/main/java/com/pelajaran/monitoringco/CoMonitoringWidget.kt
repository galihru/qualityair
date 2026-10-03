package com.pelajaran.monitoringco

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews // Tambahkan impor ini
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

class CoMonitoringWidget : AppWidgetProvider() {
    companion object {
        private const val UPDATE_INTERVAL = 1000L // Update setiap 1 detik
        private const val ACTION_UPDATE_WIDGET = "com.pelajaran.monitoringco.UPDATE_WIDGET"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            startPeriodicUpdates(context, appWidgetId)
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE_WIDGET) {
            val appWidgetId = intent.getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            )
            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                updateWidget(
                    context,
                    AppWidgetManager.getInstance(context),
                    appWidgetId
                )
            }
        }
    }

    private fun startPeriodicUpdates(context: Context, appWidgetId: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, CoMonitoringWidget::class.java).apply {
            action = ACTION_UPDATE_WIDGET
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Jadwalkan update setiap 1 detik
        alarmManager.setRepeating(
            AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis(),
            UPDATE_INTERVAL,
            pendingIntent
        )
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_layout) // Perbaiki di sini

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val data = fetchData("https://4211421036.github.io/qualityair/data.json")
                withContext(Dispatchers.Main) {
                    updateWidgetUI(context, appWidgetManager, appWidgetId, views, data)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    showError(context, appWidgetManager, appWidgetId, views)
                }
            }
        }
    }

    private suspend fun fetchData(urlString: String): String {
        return withContext(Dispatchers.IO) {
            val url = URL(urlString)
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 500
            connection.readTimeout = 500

            try {
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
    }

    private fun updateWidgetUI(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        views: RemoteViews, // Perbaiki di sini
        jsonData: String
    ) {
        try {
            val jsonResponse = JSONObject(jsonData)
            val ppm = jsonResponse.getJSONObject("data").getDouble("ppm")
            val timestamp = jsonResponse.getString("timestamp")

            val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
            val date = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).parse(timestamp)
            val formattedTimestamp = formatter.format(date)

            // Update tampilan widget
            views.setTextViewText(R.id.widgetText, "CO Level: %.2f ppm".format(ppm)) // Perbaiki di sini
            views.setTextViewText(R.id.timestampText, "Last Updated: $formattedTimestamp") // Perbaiki di sini

            // Mulai animasi ViewFlipper
            views.setViewVisibility(R.id.viewFlipper, View.VISIBLE) // Perbaiki di sini

            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            showError(context, appWidgetManager, appWidgetId, views)
        }
    }

    private fun showError(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        views: RemoteViews // Perbaiki di sini
    ) {
        views.setTextViewText(R.id.widgetText, "Error updating CO Level") // Perbaiki di sini
        views.setTextViewText(R.id.timestampText, "Last Updated: --") // Perbaiki di sini
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, CoMonitoringWidget::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }
}