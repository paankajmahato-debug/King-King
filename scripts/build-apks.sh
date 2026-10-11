#!/bin/bash
set -e

echo "=========================================================="
echo " TAZE CLINING — DUAL ANDROID APK COMPILER & PACKAGER"
echo " (With Full v1 + v2 + v3 Signing Scheme for Modern Android)"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
OUT_DIR="$ROOT_DIR/public/downloads"
KEYSTORE_DIR="$ROOT_DIR/android/keystores"

mkdir -p "$OUT_DIR"
mkdir -p "$KEYSTORE_DIR"

if [ ! -f "$ANDROID_JAR" ]; then
    echo "ERROR: Android framework SDK not found at $ANDROID_JAR"
    exit 1
fi

# Ensure dx and javac symlinks exist
if ! command -v dx &> /dev/null; then
    if [ -f "/usr/bin/dalvik-exchange" ]; then
        ln -sf /usr/bin/dalvik-exchange /usr/bin/dx
    fi
fi
if ! command -v javac &> /dev/null; then
    if [ -f "/usr/lib/jvm/java-17-openjdk-amd64/bin/javac" ]; then
        ln -sf /usr/lib/jvm/java-17-openjdk-amd64/bin/javac /usr/bin/javac
    fi
fi
if ! command -v java &> /dev/null; then
    if [ -f "/usr/lib/jvm/java-17-openjdk-amd64/bin/java" ]; then
        ln -sf /usr/lib/jvm/java-17-openjdk-amd64/bin/java /usr/bin/java
    fi
fi

# 1. GENERATE DEDICATED SIGNING KEYSTORES IF MISSING
if [ ! -f "$KEYSTORE_DIR/customer-release.keystore" ]; then
    echo "[Keystore] Creating Customer App Release Keystore..."
    keytool -genkeypair -noprompt -v \
        -keystore "$KEYSTORE_DIR/customer-release.keystore" \
        -alias taze_customer \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass tazeclining2026 -keypass tazeclining2026 \
        -dname "CN=TAZE CLINING, OU=Customer Mobile, O=TAZE CLINING, L=Mumbai, ST=Maharashtra, C=IN"
fi

if [ ! -f "$KEYSTORE_DIR/owner-release.keystore" ]; then
    echo "[Keystore] Creating Owner App Release Keystore..."
    keytool -genkeypair -noprompt -v \
        -keystore "$KEYSTORE_DIR/owner-release.keystore" \
        -alias taze_owner \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass tazeowner2026 -keypass tazeowner2026 \
        -dname "CN=TAZE CLINING OWNER, OU=Operations, O=TAZE CLINING, L=Mumbai, ST=Maharashtra, C=IN"
fi

# ==========================================================
# 2. BUILD APP 1: TAZE CLINING (CUSTOMER APP)
# ==========================================================
echo ""
echo "----------------------------------------------------------"
echo " [1/2] Building TAZE CLINING Customer APK (com.tazeclining.customer)..."
echo "----------------------------------------------------------"

CUST_DIR="$ROOT_DIR/android/customer"
rm -rf "$CUST_DIR/gen" "$CUST_DIR/bin"
mkdir -p "$CUST_DIR/gen" "$CUST_DIR/bin/classes"

echo "  -> Packaging resources and generating R.java..."
aapt package -f -m \
    -J "$CUST_DIR/gen" \
    -M "$CUST_DIR/AndroidManifest.xml" \
    -S "$CUST_DIR/res" \
    -I "$ANDROID_JAR"

echo "  -> Compiling Java source code..."
javac -source 1.8 -target 1.8 \
    -cp "$ANDROID_JAR:$CUST_DIR/gen" \
    -d "$CUST_DIR/bin/classes" \
    "$CUST_DIR/src/com/tazeclining/customer/MainActivity.java" \
    "$CUST_DIR/gen/com/tazeclining/customer/R.java"

echo "  -> Converting bytecode to Dalvik Executable (classes.dex)..."
dx --dex --output="$CUST_DIR/bin/classes.dex" "$CUST_DIR/bin/classes"

echo "  -> Creating base APK package with resources..."
aapt package -f \
    -M "$CUST_DIR/AndroidManifest.xml" \
    -S "$CUST_DIR/res" \
    -I "$ANDROID_JAR" \
    -F "$CUST_DIR/bin/customer.unsigned.apk"

echo "  -> Adding classes.dex to APK..."
(cd "$CUST_DIR/bin" && aapt add customer.unsigned.apk classes.dex)

echo "  -> ZipAligning APK to 4-byte boundaries..."
zipalign -f -p 4 \
    "$CUST_DIR/bin/customer.unsigned.apk" \
    "$CUST_DIR/bin/customer.aligned.apk"

echo "  -> Signing APK with apksigner (v1 + v2 + v3 scheme)..."
apksigner sign \
    --ks "$KEYSTORE_DIR/customer-release.keystore" \
    --ks-key-alias taze_customer \
    --ks-pass pass:tazeclining2026 \
    --key-pass pass:tazeclining2026 \
    --v1-signing-enabled true \
    --v2-signing-enabled true \
    --v3-signing-enabled true \
    --out "$OUT_DIR/taze-clining-customer.apk" \
    "$CUST_DIR/bin/customer.aligned.apk"

echo "  -> Verifying Customer APK signature and alignment..."
apksigner verify --verbose "$OUT_DIR/taze-clining-customer.apk"
zipalign -c -v 4 "$OUT_DIR/taze-clining-customer.apk" | tail -n 2

echo "  ✓ Customer APK built successfully: $OUT_DIR/taze-clining-customer.apk"

# ==========================================================
# 3. BUILD APP 2: TAZE CLINING OWNER (OWNER APP)
# ==========================================================
echo ""
echo "----------------------------------------------------------"
echo " [2/2] Building TAZE CLINING OWNER APK (com.tazeclining.owner)..."
echo "----------------------------------------------------------"

OWNER_DIR="$ROOT_DIR/android/owner"
rm -rf "$OWNER_DIR/gen" "$OWNER_DIR/bin"
mkdir -p "$OWNER_DIR/gen" "$OWNER_DIR/bin/classes"

echo "  -> Packaging resources and generating R.java..."
aapt package -f -m \
    -J "$OWNER_DIR/gen" \
    -M "$OWNER_DIR/AndroidManifest.xml" \
    -S "$OWNER_DIR/res" \
    -I "$ANDROID_JAR"

echo "  -> Compiling Java source code..."
javac -source 1.8 -target 1.8 \
    -cp "$ANDROID_JAR:$OWNER_DIR/gen" \
    -d "$OWNER_DIR/bin/classes" \
    "$OWNER_DIR/src/com/tazeclining/owner/MainActivity.java" \
    "$OWNER_DIR/gen/com/tazeclining/owner/R.java"

echo "  -> Converting bytecode to Dalvik Executable (classes.dex)..."
dx --dex --output="$OWNER_DIR/bin/classes.dex" "$OWNER_DIR/bin/classes"

echo "  -> Creating base APK package with resources..."
aapt package -f \
    -M "$OWNER_DIR/AndroidManifest.xml" \
    -S "$OWNER_DIR/res" \
    -I "$ANDROID_JAR" \
    -F "$OWNER_DIR/bin/owner.unsigned.apk"

echo "  -> Adding classes.dex to APK..."
(cd "$OWNER_DIR/bin" && aapt add owner.unsigned.apk classes.dex)

echo "  -> ZipAligning APK to 4-byte boundaries..."
zipalign -f -p 4 \
    "$OWNER_DIR/bin/owner.unsigned.apk" \
    "$OWNER_DIR/bin/owner.aligned.apk"

echo "  -> Signing APK with apksigner (v1 + v2 + v3 scheme)..."
apksigner sign \
    --ks "$KEYSTORE_DIR/owner-release.keystore" \
    --ks-key-alias taze_owner \
    --ks-pass pass:tazeowner2026 \
    --key-pass pass:tazeowner2026 \
    --v1-signing-enabled true \
    --v2-signing-enabled true \
    --v3-signing-enabled true \
    --out "$OUT_DIR/taze-clining-owner.apk" \
    "$OWNER_DIR/bin/owner.aligned.apk"

echo "  -> Verifying Owner APK signature and alignment..."
apksigner verify --verbose "$OUT_DIR/taze-clining-owner.apk"
zipalign -c -v 4 "$OUT_DIR/taze-clining-owner.apk" | tail -n 2

echo "  ✓ Owner APK built successfully: $OUT_DIR/taze-clining-owner.apk"

# Sync to dist/downloads if dist exists
if [ -d "$ROOT_DIR/dist/downloads" ]; then
    cp "$OUT_DIR"/*.apk "$ROOT_DIR/dist/downloads/"
fi

echo ""
echo "=========================================================="
echo " BUILD SUMMARY — BOTH ANDROID APKS READY & VERIFIED"
echo "=========================================================="
ls -lh "$OUT_DIR"/*.apk
echo "=========================================================="
