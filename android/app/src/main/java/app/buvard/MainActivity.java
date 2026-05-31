package app.buvard;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.CookieManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Active les cookies tiers (third-party) pour la WebView. Necessaire
        // pour que Clerk puisse poser/lire son cookie `__client` sur le domaine
        // `clerk.buvard.app` quand la WebView est servie depuis `https://localhost`
        // (donc cross-origin du point de vue cookie store). Sans ca, setActive()
        // echoue avec 401 sur /v1/client/sessions/<id>/touch apres un signIn
        // via ticket BFF Google OAuth.
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(this.bridge.getWebView(), true);

        // WebView transparente : sans ca, le preview natif de @capacitor-community/camera-preview
        // (positionne SOUS la WebView via `toBack: true`) est invisible.
        // Le contenu HTML reste opaque grace aux backgrounds CSS de body/#root,
        // sauf quand on toggle .camera-active qui les rend transparents (cf index.css).
        this.bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);

        // Background de l'Activity en noir : evite un flash blanc quand la WebView
        // est transitoirement transparente (entre la navigation vers /add/capture
        // et le moment ou le preview natif est rendu).
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
    }
}
