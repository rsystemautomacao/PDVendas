# MeuPDV Bridge - App Android para Elgin TPro / M10 / PosGo

App Android que carrega o MeuPDV em um WebView e conecta com a
impressora termica embarcada da Elgin via SDK nativo.

## Como funciona

```
MeuPDV (Web/PWA)
    |
    |  window.ElginPrinter.imprimir(json)
    |  window.ElginPrinter.imprimirTexto(texto)
    v
WebView (este app)
    |
    |  Termica.ImpressaoTexto(dados, posicao, stilo, tamanho)
    |  Termica.Corte(0)
    v
Impressora Termica Embarcada
```

## Configuracao

### 1. Baixar a lib Elgin E1

Baixe o arquivo `.aar` da lib Elgin em:
https://github.com/ElginDeveloperCommunity/Impressoras

Copie o arquivo para: `app/libs/e1-lib.aar`

### 2. Configurar a URL do MeuPDV

Edite `MainActivity.java` e altere a URL:

```java
private static final String MEUPDV_URL = "https://pdvendas.onrender.com";
```

Se estiver testando localmente, use o IP da maquina na rede:
```java
private static final String MEUPDV_URL = "http://192.168.0.100:5173";
```

### 3. Compilar e instalar

Abra o projeto no Android Studio e:
1. Sync Gradle
2. Build > Build APK
3. Instale no Elgin TPro/M10

### 4. Configurar no MeuPDV

No MeuPDV (rodando dentro do app):
1. Va em **Configuracoes > Impressoras**
2. Clique em **Nova**
3. Escolha tipo **Embarcada**
4. Modo: **Android Bridge (WebView)**
5. Defina como padrao
6. Teste a conexao

## API JavaScript disponivel

O app expoe `window.ElginPrinter` com os metodos:

| Metodo | Descricao |
|--------|-----------|
| `imprimirTexto(texto)` | Imprime texto simples |
| `imprimir(json)` | Imprime com formatacao (comandos JSON) |
| `getStatus()` | Retorna status: "ok", "sem_papel", etc |
| `cortarPapel()` | Corta o papel |
| `getVersao()` | Retorna versao da DLL Elgin |
| `setColunas(n)` | Define colunas (32=58mm, 48=80mm) |

### Formato dos comandos JSON

```json
[
  {"type":"text", "data":"TITULO\n", "align":1, "style":8, "size":17},
  {"type":"separator", "char":"-"},
  {"type":"text", "data":"Item 1       R$ 10,00\n", "align":0, "style":0, "size":0},
  {"type":"feed", "lines":3},
  {"type":"cut"},
  {"type":"qrcode", "data":"https://...", "size":4}
]
```

**align:** 0=esquerda, 1=centro, 2=direita
**style:** 0=normal, 8=bold, 2=sublinhado, 10=bold+sublinhado
**size:** 0=normal, 1=duplo-altura, 16=duplo-largura, 17=duplo

## Estrutura

```
android-bridge/
  app/
    libs/              <- Coloque e1-lib.aar aqui
    src/main/
      java/.../
        MainActivity.java        <- WebView + setup impressora
        ElginPrinterBridge.java  <- Bridge JS <-> Termica
      res/
        layout/activity_main.xml
        values/styles.xml
      AndroidManifest.xml
    build.gradle
  build.gradle
  settings.gradle
```
