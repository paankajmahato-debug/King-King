package com.tazeclining.customer;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    // Permanent Google Cloud Firestore REST API endpoint for live auto-discovery
    private static final String FIRESTORE_DISCOVERY_URL =
            "https://firestore.googleapis.com/v1/projects/gen-lang-client-0006962792/databases/ai-studio-cleenzoproorders-07724c9e-0b5d-448c-9c87-8b364083d34a/documents/system_meta/server_info";

    // Known active Cloudflare tunnel URL as primary fallback
    private static final String FALLBACK_URL =
            "https://lying-talented-horses-asn.trycloudflare.com/customer-app";

    private static final String PREFS_NAME = "TazeCustomerPrefs";
    private static final String KEY_CACHED_URL = "cached_live_url";
    private static final String KEY_CUSTOM_URL = "custom_store_url";

    private FrameLayout mContainer;
    private WebView mWebView;
    private LinearLayout mSplashLayout;
    private TextView mSplashStatusText;
    private LinearLayout mErrorLayout;
    private TextView mErrorDetailText;
    private ProgressBar mTopProgressBar;
    private SharedPreferences mPrefs;
    private Handler mHandler;
    private boolean mIsLoaded = false;
    private String mCurrentTargetUrl = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mPrefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        mHandler = new Handler(Looper.getMainLooper());

        mContainer = new FrameLayout(this);
        mContainer.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        mContainer.setBackgroundColor(Color.parseColor("#064E3B")); // Emerald dark theme

        // 1. WebView setup
        mWebView = new WebView(this);
        mWebView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        mWebView.setBackgroundColor(Color.parseColor("#F8FAFC"));
        mWebView.setVisibility(View.INVISIBLE);
        configureWebView();
        mContainer.addView(mWebView);

        // 2. Top loading bar
        mTopProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams topBarLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 8);
        topBarLp.gravity = Gravity.TOP;
        mTopProgressBar.setLayoutParams(topBarLp);
        mTopProgressBar.setMax(100);
        mTopProgressBar.setProgress(0);
        mTopProgressBar.setVisibility(View.GONE);
        mContainer.addView(mTopProgressBar);

        // 3. Error layout
        mErrorLayout = createErrorLayout();
        mContainer.addView(mErrorLayout);

        // 4. Splash / Discovery screen
        mSplashLayout = createSplashLayout();
        mContainer.addView(mSplashLayout);

        setContentView(mContainer);

        // Begin auto-discovery and loading
        startAutoDiscoveryAndConnect();
    }

    private void configureWebView() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        String customUa = settings.getUserAgentString() + " TazeCliningCustomerApp/1.2.0 (Android)";
        settings.setUserAgentString(customUa);

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    mTopProgressBar.setVisibility(View.VISIBLE);
                    mTopProgressBar.setProgress(newProgress);
                } else {
                    mTopProgressBar.setVisibility(View.GONE);
                }
            }
        });

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                mErrorLayout.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Ensure temporary proxy / tunnel certificates do not halt page rendering
                handler.proceed();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url == null) return false;

                // Open WhatsApp natively
                if (url.startsWith("whatsapp://") ||
                    url.contains("api.whatsapp.com/send") ||
                    url.contains("wa.me/")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }

                // Phone dialer
                if (url.startsWith("tel:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }

                return false;
            }

            // Android 23+ resource error handler: ONLY fail if MAIN FRAME failed
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (request != null && request.isForMainFrame() && !mIsLoaded) {
                        String errMsg = (error != null) ? String.valueOf(error.getDescription()) : "Connection error";
                        showErrorScreen("Could not reach store server (" + errMsg + ").");
                    }
                }
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (!mIsLoaded) {
                    if (failingUrl != null && failingUrl.equals(mCurrentTargetUrl)) {
                        showErrorScreen("Could not reach store server. Error code: " + errorCode);
                    }
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                // Do not crash page for minor subresources or non-main frames
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                mTopProgressBar.setVisibility(View.GONE);
                mIsLoaded = true;
                // Reveal WebView and dismiss splash smoothly
                mSplashLayout.setVisibility(View.GONE);
                mErrorLayout.setVisibility(View.GONE);
                mWebView.setVisibility(View.VISIBLE);
            }
        });
    }

    private void startAutoDiscoveryAndConnect() {
        mSplashLayout.setVisibility(View.VISIBLE);
        mErrorLayout.setVisibility(View.GONE);
        mSplashStatusText.setText("Connecting to TAZE CLINING cloud...");

        // 1. Check if user configured an explicit custom URL
        String customUrl = mPrefs.getString(KEY_CUSTOM_URL, "");
        if (customUrl != null && !customUrl.trim().isEmpty()) {
            loadTargetUrl(customUrl.trim());
            return;
        }

        // 2. Discover live server address from Google Firestore in background
        new Thread(new Runnable() {
            @Override
            public void run() {
                final String discoveredUrl = fetchLiveUrlFromFirestore();
                mHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        if (discoveredUrl != null && !discoveredUrl.isEmpty()) {
                            mPrefs.edit().putString(KEY_CACHED_URL, discoveredUrl).apply();
                            loadTargetUrl(discoveredUrl);
                        } else {
                            // Try cached URL
                            String cached = mPrefs.getString(KEY_CACHED_URL, "");
                            if (cached != null && !cached.isEmpty()) {
                                loadTargetUrl(cached);
                            } else {
                                // Default fallback to current tunnel URL
                                loadTargetUrl(FALLBACK_URL);
                            }
                        }
                    }
                });
            }
        }).start();
    }

    private String fetchLiveUrlFromFirestore() {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(FIRESTORE_DISCOVERY_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("User-Agent", "TazeCliningCustomerApp/1.2.0");

            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONObject root = new JSONObject(sb.toString());
                JSONObject fields = root.optJSONObject("fields");
                if (fields != null) {
                    // Check customerAppUrl first
                    JSONObject custField = fields.optJSONObject("customerAppUrl");
                    if (custField != null) {
                        String custUrl = custField.optString("stringValue");
                        if (custUrl != null && custUrl.startsWith("http")) {
                            return custUrl;
                        }
                    }

                    // Fallback to publicUrl + /customer-app
                    JSONObject pubField = fields.optJSONObject("publicUrl");
                    if (pubField != null) {
                        String pubUrl = pubField.optString("stringValue");
                        if (pubUrl != null && pubUrl.startsWith("http")) {
                            return pubUrl.replaceAll("/+$", "") + "/customer-app";
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Ignore - handled by fallback
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
        return null;
    }

    private void loadTargetUrl(String url) {
        mCurrentTargetUrl = url;
        mSplashStatusText.setText("Loading catalog...");
        mWebView.loadUrl(url);

        // Safety timeout: if page does not finish within 15 seconds, check if still invisible
        mHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!mIsLoaded && mSplashLayout.getVisibility() == View.VISIBLE) {
                    showErrorScreen("Connection taking longer than usual. Please check your data connection or configure URL.");
                }
            }
        }, 15000);
    }

    private LinearLayout createSplashLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.parseColor("#064E3B")); // Deep Emerald
        layout.setPadding(32, 32, 32, 32);

        // Title
        TextView title = new TextView(this);
        title.setText("TAZE CLINING");
        title.setTextColor(Color.WHITE);
        title.setTextSize(26);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        layout.addView(title);

        // Subtitle
        TextView sub = new TextView(this);
        sub.setText("Premium Cleaning Solutions");
        sub.setTextColor(Color.parseColor("#6EE7B7"));
        sub.setTextSize(13);
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, 4, 0, 36);
        layout.addView(sub);

        // Spinner
        ProgressBar spinner = new ProgressBar(this);
        layout.addView(spinner);

        // Status text
        mSplashStatusText = new TextView(this);
        mSplashStatusText.setText("Connecting to cloud...");
        mSplashStatusText.setTextColor(Color.parseColor("#D1FAE5"));
        mSplashStatusText.setTextSize(12);
        mSplashStatusText.setGravity(Gravity.CENTER);
        mSplashStatusText.setPadding(0, 16, 0, 0);
        layout.addView(mSplashStatusText);

        return layout;
    }

    private LinearLayout createErrorLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.parseColor("#0F172A")); // Slate 900
        layout.setPadding(40, 40, 40, 40);
        layout.setVisibility(View.GONE);

        // Error icon/title
        TextView title = new TextView(this);
        title.setText("Server Connection Issue");
        title.setTextColor(Color.parseColor("#F87171")); // Red 400
        title.setTextSize(20);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        layout.addView(title);

        mErrorDetailText = new TextView(this);
        mErrorDetailText.setText("Could not reach store server. Please check your internet connection.");
        mErrorDetailText.setTextColor(Color.parseColor("#94A3B8"));
        mErrorDetailText.setTextSize(13);
        mErrorDetailText.setGravity(Gravity.CENTER);
        mErrorDetailText.setPadding(0, 12, 0, 24);
        layout.addView(mErrorDetailText);

        // Button 1: Retry Connection
        Button retryBtn = new Button(this);
        retryBtn.setText("Retry Connection");
        retryBtn.setBackgroundColor(Color.parseColor("#059669")); // Emerald 600
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setPadding(32, 16, 32, 16);
        retryBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mIsLoaded = false;
                startAutoDiscoveryAndConnect();
            }
        });
        layout.addView(retryBtn);

        // Button 2: WhatsApp Direct Order
        Button waBtn = new Button(this);
        waBtn.setText("Order Directly on WhatsApp");
        waBtn.setBackgroundColor(Color.parseColor("#25D366")); // WhatsApp Green
        waBtn.setTextColor(Color.WHITE);
        waBtn.setPadding(32, 16, 32, 16);
        LinearLayout.LayoutParams waLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        waLp.setMargins(0, 16, 0, 0);
        waBtn.setLayoutParams(waLp);
        waBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    String msg = "Hello TAZE CLINING, I want to place an order for Floor Cleaner / Dishwasher / Detergent.";
                    String waUrl = "https://api.whatsapp.com/send?text=" + Uri.encode(msg);
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)));
                } catch (Exception e) {}
            }
        });
        layout.addView(waBtn);

        // Button 3: Custom Server URL / Settings
        Button setUrlBtn = new Button(this);
        setUrlBtn.setText("Configure Store URL");
        setUrlBtn.setBackgroundColor(Color.parseColor("#334155"));
        setUrlBtn.setTextColor(Color.parseColor("#F1F5F9"));
        setUrlBtn.setPadding(24, 12, 24, 12);
        LinearLayout.LayoutParams setLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        setLp.setMargins(0, 16, 0, 0);
        setUrlBtn.setLayoutParams(setLp);
        setUrlBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showServerUrlDialog();
            }
        });
        layout.addView(setUrlBtn);

        return layout;
    }

    private void showErrorScreen(String message) {
        mWebView.setVisibility(View.INVISIBLE);
        mSplashLayout.setVisibility(View.GONE);
        if (mErrorDetailText != null) {
            String urlText = (mCurrentTargetUrl != null && !mCurrentTargetUrl.isEmpty())
                    ? "\nTarget: " + mCurrentTargetUrl
                    : "";
            mErrorDetailText.setText(message + urlText);
        }
        mErrorLayout.setVisibility(View.VISIBLE);
    }

    private void showServerUrlDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Store Server URL");
        builder.setMessage("Enter the live store address (e.g. from the admin portal):");

        final EditText input = new EditText(this);
        input.setHint(FALLBACK_URL);
        input.setText(mCurrentTargetUrl != null && !mCurrentTargetUrl.isEmpty() ? mCurrentTargetUrl : FALLBACK_URL);
        builder.setView(input);

        builder.setPositiveButton("Connect", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String val = input.getText().toString().trim();
                if (!val.isEmpty()) {
                    if (!val.startsWith("http://") && !val.startsWith("https://")) {
                        val = "https://" + val;
                    }
                    if (!val.contains("/customer-app") && !val.contains("/owner-app")) {
                        val = val.replaceAll("/+$", "") + "/customer-app";
                    }
                    mPrefs.edit().putString(KEY_CUSTOM_URL, val).apply();
                    mIsLoaded = false;
                    loadTargetUrl(val);
                }
            }
        });

        builder.setNeutralButton("Reset Default", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                mPrefs.edit().remove(KEY_CUSTOM_URL).apply();
                mIsLoaded = false;
                startAutoDiscoveryAndConnect();
            }
        });

        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) {
            mWebView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }
}
