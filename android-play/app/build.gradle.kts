plugins { id("com.android.application") }

android {
    namespace = "com.titanesdomino.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.titanesdomino.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    signingConfigs {
        create("release") {
            val ks = System.getenv("TITANES_KEYSTORE_PATH")
            if (!ks.isNullOrBlank()) storeFile = file(ks)
            storePassword = System.getenv("TITANES_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("TITANES_KEY_ALIAS")
            keyPassword = System.getenv("TITANES_KEY_PASSWORD")
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            if (!System.getenv("TITANES_KEYSTORE_PATH").isNullOrBlank()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}
