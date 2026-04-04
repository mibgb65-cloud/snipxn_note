const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-document-picker',
  'android',
  'src',
  'main',
  'java',
  'com',
  'reactnativedocumentpicker',
  'RNDocumentPickerModule.java',
);

if (!fs.existsSync(targetFile)) {
  console.log('[patch-document-picker] target file not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');
const original = content;

const replacements = [
  [
    "import android.net.Uri;\nimport android.os.Bundle;",
    "import android.net.Uri;\nimport android.os.AsyncTask;\nimport android.os.Bundle;",
  ],
  [
    "import com.facebook.react.bridge.GuardedResultAsyncTask;\n",
    '',
  ],
  [
    'private static class ProcessDataTask extends GuardedResultAsyncTask<ReadableArray> {',
    'private static class ProcessDataTask extends AsyncTask<Void, Void, ReadableArray> {',
  ],
  [
    "    protected ProcessDataTask(ReactContext reactContext, List<Uri> uris, String copyTo, Promise promise) {\n      super(reactContext.getExceptionHandler());\n",
    "    protected ProcessDataTask(ReactContext reactContext, List<Uri> uris, String copyTo, Promise promise) {\n",
  ],
  [
    '    protected ReadableArray doInBackgroundGuarded() {',
    '    protected ReadableArray doInBackground(Void... ignored) {',
  ],
  [
    '    protected void onPostExecuteGuarded(ReadableArray readableArray) {',
    '    protected void onPostExecute(ReadableArray readableArray) {',
  ],
];

for (const [search, replace] of replacements) {
  if (content.includes(search)) {
    content = content.replace(search, replace);
  }
}

if (content === original) {
  console.log('[patch-document-picker] no changes needed');
  process.exit(0);
}

fs.writeFileSync(targetFile, content);
console.log('[patch-document-picker] applied Android compatibility patch');
