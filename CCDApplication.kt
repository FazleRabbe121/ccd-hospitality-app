package com.ccd.abetteryou

import android.app.Application
import com.google.firebase.FirebaseApp

class CCDApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
    }
}
