package com.pelajaran.monitoringco

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView: WebView = findViewById(R.id.webView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true

        // Mengatur WebViewClient untuk menangani navigasi di dalam WebView
        webView.webViewClient = WebViewClient()

        // Memuat URL eksternal
        val url = "https://4211421036.github.io/qualityair/" // Ganti dengan URL Anda
        webView.loadUrl(url)
    }
}