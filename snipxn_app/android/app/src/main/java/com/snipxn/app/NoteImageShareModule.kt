package com.snipxn.app

import android.content.Intent
import android.content.ClipData
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.File
import java.io.FileOutputStream

class NoteImageShareModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NoteImageShare"

  @ReactMethod
  fun shareNoteImage(options: ReadableMap, promise: Promise) {
    try {
      val title = readString(options, "title", "Untitled Note")
      val summary = readString(options, "summary", "")
      val language = readString(options, "language", "")
      val updatedAt = readString(options, "updatedAt", "")
      val shareUrl = readString(options, "shareUrl", "")
      val brand = readString(options, "brand", "Snipxn")
      val footer = readString(options, "footer", "Generated from Snipxn Android")
      val qrLabel = readString(options, "qrLabel", "Scan to open")
      val chooserTitle = readString(options, "chooserTitle", "Share note image")

      val bitmap = createShareBitmap(
        title = title,
        summary = summary,
        language = language,
        updatedAt = updatedAt,
        brand = brand,
        footer = footer,
        qrLabel = qrLabel,
        shareUrl = shareUrl,
      )
      val file = writeBitmapToCache(bitmap)
      bitmap.recycle()

      val uri = FileProvider.getUriForFile(
        reactContext,
        "${reactContext.packageName}.shareprovider",
        file,
      )

      val sendIntent = Intent(Intent.ACTION_SEND).apply {
        type = "image/png"
        putExtra(Intent.EXTRA_STREAM, uri)
        putExtra(Intent.EXTRA_TITLE, title)
        clipData = ClipData.newUri(reactContext.contentResolver, title, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val chooserIntent = Intent.createChooser(sendIntent, chooserTitle).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }

      reactContext.currentActivity?.startActivity(chooserIntent) ?: reactContext.startActivity(chooserIntent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("NOTE_IMAGE_SHARE_FAILED", error.message, error)
    }
  }

  private fun readString(options: ReadableMap, key: String, fallback: String): String {
    if (!options.hasKey(key) || options.isNull(key)) {
      return fallback
    }

    return options.getString(key)?.trim().orEmpty().ifEmpty { fallback }
  }

  private fun createShareBitmap(
    title: String,
    summary: String,
    language: String,
    updatedAt: String,
    brand: String,
    footer: String,
    qrLabel: String,
    shareUrl: String,
  ): Bitmap {
    val width = 1440
    val height = 900
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    paint.color = Color.parseColor("#F4F8F7")
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)

    val cardRect = RectF(72f, 72f, (width - 72).toFloat(), (height - 72).toFloat())
    paint.color = Color.WHITE
    paint.style = Paint.Style.FILL
    canvas.drawRoundRect(cardRect, 18f, 18f, paint)

    paint.color = Color.parseColor("#D6E3DF")
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = 2f
    canvas.drawRoundRect(cardRect, 18f, 18f, paint)
    paint.style = Paint.Style.FILL

    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    paint.textSize = 26f
    paint.color = Color.parseColor("#17453F")
    canvas.drawText(brand, 112f, 132f, paint)

    val meta = listOf(language, updatedAt).filter { it.isNotBlank() }.joinToString("  /  ")
    if (meta.isNotBlank()) {
      paint.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
      paint.textSize = 20f
      paint.color = Color.parseColor("#5B6F6B")
      canvas.drawText(meta, 112f, 186f, paint)
    }

    drawTextBlock(
      canvas = canvas,
      text = title.ifBlank { "Untitled Note" },
      x = 112f,
      y = 246f,
      width = width - 224,
      textSize = 56f,
      color = "#102321",
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD),
      maxLines = 2,
      lineSpacing = 12f,
    )

    paint.color = Color.parseColor("#DFE9E6")
    canvas.drawRect(112f, 386f, (width - 112).toFloat(), 388f, paint)

    drawTextBlock(
      canvas = canvas,
      text = summary.ifBlank { "Share your note with a cleaner summary card." },
      x = 112f,
      y = 432f,
      width = if (shareUrl.isBlank()) width - 224 else width - 520,
      textSize = 30f,
      color = "#35514B",
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL),
      maxLines = if (shareUrl.isBlank()) 7 else 6,
      lineSpacing = 8f,
    )

    if (shareUrl.isNotBlank()) {
      drawQrCode(canvas, shareUrl, (width - 352).toFloat(), 572f, 240f, qrLabel)
    }

    paint.typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
    paint.textSize = 20f
    paint.color = Color.parseColor("#7A908B")
    canvas.drawText(footer, 112f, (height - 118).toFloat(), paint)

    if (shareUrl.isNotBlank()) {
      drawTextBlock(
        canvas = canvas,
        text = shareUrl,
        x = 112f,
        y = (height - 88).toFloat(),
        width = width - 224,
        textSize = 18f,
        color = "#5B6F6B",
        typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL),
        maxLines = 1,
        lineSpacing = 0f,
      )
    }

    return bitmap
  }

  private fun drawQrCode(canvas: Canvas, value: String, x: Float, y: Float, size: Float, label: String) {
    val modules = FixedQrCode.encode(value)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    val background = RectF(x - 24f, y - 24f, x + size + 24f, y + size + 68f)

    paint.style = Paint.Style.FILL
    paint.color = Color.WHITE
    canvas.drawRoundRect(background, 18f, 18f, paint)
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = 2f
    paint.color = Color.parseColor("#D6E3DF")
    canvas.drawRoundRect(background, 18f, 18f, paint)
    paint.style = Paint.Style.FILL

    val moduleCount = modules.size
    val cellSize = size / moduleCount
    paint.color = Color.parseColor("#102321")

    for (row in modules.indices) {
      for (col in modules[row].indices) {
        if (modules[row][col]) {
          canvas.drawRect(
            x + col * cellSize,
            y + row * cellSize,
            x + (col + 1) * cellSize + 0.2f,
            y + (row + 1) * cellSize + 0.2f,
            paint,
          )
        }
      }
    }

    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    paint.textSize = 21f
    paint.textAlign = Paint.Align.CENTER
    paint.color = Color.parseColor("#5B6F6B")
    canvas.drawText(label, x + size / 2f, y + size + 42f, paint)
    paint.textAlign = Paint.Align.LEFT
  }

  private fun drawTextBlock(
    canvas: Canvas,
    text: String,
    x: Float,
    y: Float,
    width: Int,
    textSize: Float,
    color: String,
    typeface: Typeface,
    maxLines: Int,
    lineSpacing: Float,
  ) {
    val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
      this.color = Color.parseColor(color)
      this.textSize = textSize
      this.typeface = typeface
    }
    val layout = StaticLayout.Builder
      .obtain(text.trim(), 0, text.trim().length, textPaint, width)
      .setAlignment(Layout.Alignment.ALIGN_NORMAL)
      .setEllipsize(TextUtils.TruncateAt.END)
      .setLineSpacing(lineSpacing, 1f)
      .setMaxLines(maxLines)
      .build()

    canvas.save()
    canvas.translate(x, y)
    layout.draw(canvas)
    canvas.restore()
  }

  private fun writeBitmapToCache(bitmap: Bitmap): File {
    val directory = File(reactContext.cacheDir, "shared_note_images")
    if (!directory.exists()) {
      directory.mkdirs()
    }

    val file = File(directory, "snipxn-note-${System.currentTimeMillis()}.png")
    FileOutputStream(file).use { output ->
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
    }
    return file
  }

  private object FixedQrCode {
    private const val VERSION = 5
    private const val SIZE = 37
    private const val DATA_CODEWORDS = 108
    private const val ECC_CODEWORDS = 26
    private const val TOTAL_CODEWORDS = 134
    private const val MASK_PATTERN = 0

    fun encode(value: String): Array<BooleanArray> {
      val bytes = value.toByteArray(Charsets.UTF_8)
      if (bytes.size > 106) {
        throw IllegalArgumentException("Share link is too long for QR image.")
      }

      val matrix = Array(SIZE) { BooleanArray(SIZE) }
      val functionModules = Array(SIZE) { BooleanArray(SIZE) }
      drawFunctionPatterns(matrix, functionModules)

      val dataCodewords = createDataCodewords(bytes)
      val eccCodewords = createErrorCorrectionCodewords(dataCodewords)
      val allCodewords = dataCodewords + eccCodewords
      drawCodewords(matrix, functionModules, allCodewords)
      applyMask(matrix, functionModules)
      drawFormatBits(matrix, functionModules)

      return addQuietZone(matrix)
    }

    private fun createDataCodewords(bytes: ByteArray): IntArray {
      val bits = mutableListOf<Int>()
      appendBits(bits, 0x4, 4)
      appendBits(bits, bytes.size, 8)
      for (byte in bytes) {
        appendBits(bits, byte.toInt() and 0xFF, 8)
      }

      val capacityBits = DATA_CODEWORDS * 8
      repeat(minOf(4, capacityBits - bits.size)) {
        bits.add(0)
      }
      while (bits.size % 8 != 0) {
        bits.add(0)
      }

      val codewords = mutableListOf<Int>()
      for (index in bits.indices step 8) {
        var codeword = 0
        for (offset in 0 until 8) {
          codeword = (codeword shl 1) or bits[index + offset]
        }
        codewords.add(codeword)
      }

      var padIndex = 0
      while (codewords.size < DATA_CODEWORDS) {
        codewords.add(if (padIndex % 2 == 0) 0xEC else 0x11)
        padIndex += 1
      }

      return codewords.toIntArray()
    }

    private fun appendBits(bits: MutableList<Int>, value: Int, length: Int) {
      for (index in length - 1 downTo 0) {
        bits.add((value ushr index) and 1)
      }
    }

    private fun drawFunctionPatterns(matrix: Array<BooleanArray>, functionModules: Array<BooleanArray>) {
      drawFinderPattern(matrix, functionModules, 0, 0)
      drawFinderPattern(matrix, functionModules, SIZE - 7, 0)
      drawFinderPattern(matrix, functionModules, 0, SIZE - 7)
      drawAlignmentPattern(matrix, functionModules, 30, 30)

      for (index in 0 until SIZE) {
        val value = index % 2 == 0
        if (!functionModules[6][index]) {
          setFunctionModule(matrix, functionModules, index, 6, value)
        }
        if (!functionModules[index][6]) {
          setFunctionModule(matrix, functionModules, 6, index, value)
        }
      }

      for (index in 0..8) {
        setFunctionModule(matrix, functionModules, 8, index, false)
        setFunctionModule(matrix, functionModules, index, 8, false)
      }
      for (index in SIZE - 8 until SIZE) {
        setFunctionModule(matrix, functionModules, index, 8, false)
      }
      for (index in SIZE - 7 until SIZE) {
        setFunctionModule(matrix, functionModules, 8, index, false)
      }

      setFunctionModule(matrix, functionModules, 8, 4 * VERSION + 9, true)
    }

    private fun drawFinderPattern(
      matrix: Array<BooleanArray>,
      functionModules: Array<BooleanArray>,
      left: Int,
      top: Int,
    ) {
      for (dy in -1..7) {
        for (dx in -1..7) {
          val x = left + dx
          val y = top + dy
          if (x !in 0 until SIZE || y !in 0 until SIZE) {
            continue
          }

          val isBlack = dx in 0..6 &&
            dy in 0..6 &&
            (dx == 0 || dx == 6 || dy == 0 || dy == 6 || (dx in 2..4 && dy in 2..4))
          setFunctionModule(matrix, functionModules, x, y, isBlack)
        }
      }
    }

    private fun drawAlignmentPattern(
      matrix: Array<BooleanArray>,
      functionModules: Array<BooleanArray>,
      centerX: Int,
      centerY: Int,
    ) {
      for (dy in -2..2) {
        for (dx in -2..2) {
          val isBlack = maxOf(kotlin.math.abs(dx), kotlin.math.abs(dy)) != 1
          setFunctionModule(matrix, functionModules, centerX + dx, centerY + dy, isBlack)
        }
      }
    }

    private fun setFunctionModule(
      matrix: Array<BooleanArray>,
      functionModules: Array<BooleanArray>,
      x: Int,
      y: Int,
      isBlack: Boolean,
    ) {
      matrix[y][x] = isBlack
      functionModules[y][x] = true
    }

    private fun drawCodewords(
      matrix: Array<BooleanArray>,
      functionModules: Array<BooleanArray>,
      codewords: IntArray,
    ) {
      var bitIndex = 0
      var right = SIZE - 1
      var upward = true

      while (right >= 1) {
        if (right == 6) {
          right -= 1
        }

        val rowRange = if (upward) SIZE - 1 downTo 0 else 0 until SIZE
        for (row in rowRange) {
          for (offset in 0..1) {
            val col = right - offset
            if (functionModules[row][col]) {
              continue
            }

            val bit = if (bitIndex < TOTAL_CODEWORDS * 8) {
              ((codewords[bitIndex / 8] ushr (7 - bitIndex % 8)) and 1) == 1
            } else {
              false
            }
            matrix[row][col] = bit
            bitIndex += 1
          }
        }

        upward = !upward
        right -= 2
      }
    }

    private fun applyMask(matrix: Array<BooleanArray>, functionModules: Array<BooleanArray>) {
      for (y in 0 until SIZE) {
        for (x in 0 until SIZE) {
          if (!functionModules[y][x] && shouldMask(x, y)) {
            matrix[y][x] = !matrix[y][x]
          }
        }
      }
    }

    private fun shouldMask(x: Int, y: Int): Boolean = (x + y) % 2 == 0

    private fun drawFormatBits(matrix: Array<BooleanArray>, functionModules: Array<BooleanArray>) {
      val data = (1 shl 3) or MASK_PATTERN
      var remainder = data shl 10
      val generator = 0x537
      for (shift in 14 downTo 10) {
        if (((remainder ushr shift) and 1) != 0) {
          remainder = remainder xor (generator shl (shift - 10))
        }
      }
      val bits = ((data shl 10) or remainder) xor 0x5412

      fun bit(index: Int): Boolean = ((bits ushr index) and 1) != 0

      for (index in 0..5) setFunctionModule(matrix, functionModules, 8, index, bit(index))
      setFunctionModule(matrix, functionModules, 8, 7, bit(6))
      setFunctionModule(matrix, functionModules, 8, 8, bit(7))
      setFunctionModule(matrix, functionModules, 7, 8, bit(8))
      for (index in 9..14) setFunctionModule(matrix, functionModules, 14 - index, 8, bit(index))

      for (index in 0..7) setFunctionModule(matrix, functionModules, SIZE - 1 - index, 8, bit(index))
      for (index in 8..14) setFunctionModule(matrix, functionModules, 8, SIZE - 15 + index, bit(index))
      setFunctionModule(matrix, functionModules, 8, SIZE - 8, true)
    }

    private fun createErrorCorrectionCodewords(data: IntArray): IntArray {
      val generator = reedSolomonGenerator(ECC_CODEWORDS)
      val remainder = IntArray(ECC_CODEWORDS)

      for (value in data) {
        val factor = value xor remainder[0]
        for (index in 0 until ECC_CODEWORDS - 1) {
          remainder[index] = remainder[index + 1]
        }
        remainder[ECC_CODEWORDS - 1] = 0

        for (index in 0 until ECC_CODEWORDS) {
          remainder[index] = remainder[index] xor gfMultiply(generator[index], factor)
        }
      }

      return remainder
    }

    private fun reedSolomonGenerator(degree: Int): IntArray {
      val result = IntArray(degree)
      result[degree - 1] = 1
      var root = 1

      repeat(degree) {
        for (index in result.indices) {
          result[index] = gfMultiply(result[index], root)
          if (index + 1 < result.size) {
            result[index] = result[index] xor result[index + 1]
          }
        }
        root = gfMultiply(root, 0x02)
      }

      return result
    }

    private fun gfMultiply(left: Int, right: Int): Int {
      var x = left
      var y = right
      var result = 0

      while (y != 0) {
        if ((y and 1) != 0) {
          result = result xor x
        }
        x = x shl 1
        if ((x and 0x100) != 0) {
          x = x xor 0x11D
        }
        y = y ushr 1
      }

      return result and 0xFF
    }

    private fun addQuietZone(matrix: Array<BooleanArray>): Array<BooleanArray> {
      val quietZone = 4
      val outputSize = SIZE + quietZone * 2
      val output = Array(outputSize) { BooleanArray(outputSize) }

      for (row in 0 until SIZE) {
        for (col in 0 until SIZE) {
          output[row + quietZone][col + quietZone] = matrix[row][col]
        }
      }

      return output
    }
  }
}
