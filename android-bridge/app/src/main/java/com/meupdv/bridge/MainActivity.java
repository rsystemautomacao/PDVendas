package com.meupdv.bridge;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;

import androidx.appcompat.app.AppCompatActivity;

import com.elgin.e1.Impressora.Termica;

/**
 * MeuPDV Bridge - App Android que carrega o MeuPDV em WebView
 * e expoe a impressora Elgin embarcada via JavaScript Interface.
 *
 * O MeuPDV web chama: window.ElginPrinter.imprimirTexto(json)
 * e este app traduz para: Termica.ImpressaoTexto(...)
 */
public class MainActivity extends AppCompatActivity {

    // ======== CONFIGURACAO ========
    // Altere a URL para o endereço do seu MeuPDV
    private static final String MEUPDV_URL = "https://pdvendas.onrender.com";

    private WebView webView;
    private LinearLayout loadingOverlay;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        loadingOverlay = findViewById(R.id.loadingOverlay);

        // ---- Setup impressora Elgin ----
        try {
            Termica.setActivity(this);
            Termica.AbreConexaoImpressora(5, "", "", 0);
            // Não fecha a conexão para manter aberta durante uso
        } catch (Exception e) {
            e.printStackTrace();
        }

        // ---- Setup WebView ----
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);           // localStorage
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Adiciona a JavaScript Interface para o MeuPDV web chamar
        webView.addJavascriptInterface(new ElginPrinterBridge(this), "ElginPrinter");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Esconde o loading quando a pagina carrega
                loadingOverlay.setVisibility(View.GONE);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Mantém toda navegação dentro do WebView
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        // Carrega o MeuPDV
        webView.loadUrl(MEUPDV_URL);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Botão voltar: navega para trás no WebView
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            Termica.FechaConexaoImpressora();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
