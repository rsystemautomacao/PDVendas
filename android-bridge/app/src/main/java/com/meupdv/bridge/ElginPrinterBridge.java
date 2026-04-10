package com.meupdv.bridge;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.util.Log;

import com.elgin.e1.Impressora.Termica;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Bridge JavaScript <-> Impressora Elgin.
 *
 * Expoe metodos que o MeuPDV web pode chamar via:
 *   window.ElginPrinter.imprimirTexto(texto)
 *   window.ElginPrinter.imprimir(jsonComandos)
 *   window.ElginPrinter.getStatus()
 *   window.ElginPrinter.cortarPapel()
 *
 * Exemplo de uso no JavaScript:
 *
 *   // Modo simples - texto direto
 *   window.ElginPrinter.imprimirTexto("Texto simples\npara imprimir\n");
 *
 *   // Modo avancado - comandos formatados
 *   window.ElginPrinter.imprimir(JSON.stringify([
 *     {"type":"text", "data":"TITULO\n", "align":1, "style":8, "size":17},
 *     {"type":"text", "data":"Item 1       R$ 10,00\n", "align":0, "style":0, "size":0},
 *     {"type":"separator"},
 *     {"type":"text", "data":"TOTAL: R$ 10,00\n", "align":2, "style":8, "size":1},
 *     {"type":"feed", "lines":3},
 *     {"type":"cut"}
 *   ]));
 */
public class ElginPrinterBridge {

    private static final String TAG = "ElginPrinter";
    private final Activity activity;

    // Estilos (bitmask - some para combinar)
    public static final int STYLE_FONT_A   = 0;  // Fonte normal (12x24)
    public static final int STYLE_FONT_B   = 1;  // Fonte menor (9x17)
    public static final int STYLE_UNDERLINE = 2;  // Sublinhado
    public static final int STYLE_REVERSE  = 4;  // Invertido (branco no preto)
    public static final int STYLE_BOLD     = 8;  // Negrito

    // Tamanhos pre-definidos
    public static final int SIZE_NORMAL    = 0;   // 1x largura, 1x altura
    public static final int SIZE_DOUBLE_H  = 1;   // 1x largura, 2x altura
    public static final int SIZE_DOUBLE_W  = 16;  // 2x largura, 1x altura
    public static final int SIZE_DOUBLE    = 17;  // 2x largura, 2x altura

    // Separador padrao (48 colunas para papel 80mm)
    private int colunas = 48;

    public ElginPrinterBridge(Activity activity) {
        this.activity = activity;
    }

    // ============================================================
    // METODOS EXPOSTOS AO JAVASCRIPT
    // ============================================================

    /**
     * Imprime texto simples (sem formatacao).
     * Mais simples de usar do lado web.
     */
    @JavascriptInterface
    public boolean imprimirTexto(String texto) {
        try {
            Log.d(TAG, "imprimirTexto: " + texto.length() + " chars");

            int ret = Termica.AbreConexaoImpressora(5, "", "", 0);
            if (ret != 0) {
                Log.e(TAG, "Erro ao abrir conexao: " + ret);
                return false;
            }

            // Divide o texto em linhas e imprime cada uma
            String[] linhas = texto.split("\n");
            for (String linha : linhas) {
                Termica.ImpressaoTexto(linha + "\n", 0, 0, 0);
            }

            Termica.AvancaPapel(3);
            Termica.Corte(0);
            Termica.FechaConexaoImpressora();

            return true;
        } catch (Exception e) {
            Log.e(TAG, "Erro em imprimirTexto", e);
            return false;
        }
    }

    /**
     * Imprime usando comandos estruturados em JSON.
     * Permite formatacao completa (negrito, tamanho, alinhamento, etc).
     *
     * Formato JSON esperado (array de comandos):
     * [
     *   {"type":"text", "data":"texto\n", "align":1, "style":8, "size":17},
     *   {"type":"separator", "char":"-"},
     *   {"type":"feed", "lines":3},
     *   {"type":"cut"},
     *   {"type":"qrcode", "data":"https://...", "size":4},
     *   {"type":"barcode", "data":"7891234567890", "height":60, "width":2}
     * ]
     */
    @JavascriptInterface
    public boolean imprimir(String jsonComandos) {
        try {
            Log.d(TAG, "imprimir: " + jsonComandos.length() + " chars");

            int ret = Termica.AbreConexaoImpressora(5, "", "", 0);
            if (ret != 0) {
                Log.e(TAG, "Erro ao abrir conexao: " + ret);
                return false;
            }

            JSONArray comandos = new JSONArray(jsonComandos);

            for (int i = 0; i < comandos.length(); i++) {
                JSONObject cmd = comandos.getJSONObject(i);
                String type = cmd.getString("type");

                switch (type) {
                    case "text":
                        processText(cmd);
                        break;
                    case "separator":
                        processSeparator(cmd);
                        break;
                    case "feed":
                        int lines = cmd.optInt("lines", 3);
                        Termica.AvancaPapel(lines);
                        break;
                    case "cut":
                        int cutLines = cmd.optInt("lines", 0);
                        Termica.Corte(cutLines);
                        break;
                    case "qrcode":
                        processQRCode(cmd);
                        break;
                    case "barcode":
                        processBarcode(cmd);
                        break;
                    case "image":
                        String path = cmd.getString("path");
                        Termica.ImprimeImagem(path);
                        break;
                    case "init":
                        Termica.InicializaImpressora();
                        break;
                    default:
                        Log.w(TAG, "Comando desconhecido: " + type);
                }
            }

            Termica.FechaConexaoImpressora();
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Erro em imprimir", e);
            return false;
        }
    }

    /**
     * Retorna o status da impressora.
     * Retornos: "ok", "sem_papel", "pouco_papel", "ocupada", "erro"
     */
    @JavascriptInterface
    public String getStatus() {
        try {
            Termica.AbreConexaoImpressora(5, "", "", 0);
            int status = Termica.StatusImpressora(5); // Status geral
            int papel = Termica.StatusImpressora(3);  // Status papel
            Termica.FechaConexaoImpressora();

            if (papel == 7) return "sem_papel";
            if (papel == 6) return "pouco_papel";
            if (status == 10) return "ocupada";
            if (status == 11) return "ok";

            return "ok";
        } catch (Exception e) {
            Log.e(TAG, "Erro ao obter status", e);
            return "erro";
        }
    }

    /**
     * Corta o papel.
     */
    @JavascriptInterface
    public boolean cortarPapel() {
        try {
            Termica.AbreConexaoImpressora(5, "", "", 0);
            Termica.AvancaPapel(3);
            Termica.Corte(0);
            Termica.FechaConexaoImpressora();
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Erro ao cortar papel", e);
            return false;
        }
    }

    /**
     * Retorna a versao da DLL Elgin.
     */
    @JavascriptInterface
    public String getVersao() {
        try {
            return Termica.GetVersaoDLL();
        } catch (Exception e) {
            return "desconhecida";
        }
    }

    /**
     * Define o numero de colunas (32 para 58mm, 48 para 80mm).
     */
    @JavascriptInterface
    public void setColunas(int cols) {
        this.colunas = cols;
    }

    // ============================================================
    // PROCESSAMENTO INTERNO DE COMANDOS
    // ============================================================

    private void processText(JSONObject cmd) throws Exception {
        String data = cmd.getString("data");
        int align = cmd.optInt("align", 0);    // 0=esq, 1=centro, 2=dir
        int style = cmd.optInt("style", 0);    // bitmask: 8=bold, 2=underline
        int size  = cmd.optInt("size", 0);     // 0=normal, 17=double

        Termica.ImpressaoTexto(data, align, style, size);
    }

    private void processSeparator(JSONObject cmd) throws Exception {
        String ch = cmd.optString("char", "-");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < colunas; i++) {
            sb.append(ch);
        }
        sb.append("\n");
        Termica.ImpressaoTexto(sb.toString(), 0, 0, 0);
    }

    private void processQRCode(JSONObject cmd) throws Exception {
        String data = cmd.getString("data");
        int size = cmd.optInt("size", 4);           // 1-6
        int errorLevel = cmd.optInt("errorLevel", 2); // 1=L, 2=M, 3=Q, 4=H
        Termica.ImpressaoQRCode(data, size, errorLevel);
    }

    private void processBarcode(JSONObject cmd) throws Exception {
        String data = cmd.getString("data");
        int tipo = cmd.optInt("tipo", 4);     // 4=EAN-13
        int height = cmd.optInt("height", 60);
        int width = cmd.optInt("width", 2);
        int hri = cmd.optInt("hri", 4);       // 4=below
        Termica.ImpressaoCodigoBarras(tipo, data, height, width, hri);
    }
}
