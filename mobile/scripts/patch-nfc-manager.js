const fs = require("node:fs");
const path = require("node:path");

const sourcePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-nfc-manager",
  "src",
  "NfcManagerAndroid.js",
);

if (!fs.existsSync(sourcePath)) {
  process.exit(0);
}

const source = fs.readFileSync(sourcePath, "utf8");
// Make sure callNative only sends [tech] because the Java method expects (ReadableArray techs, Callback callback)
if (source.includes("callNative('requestTechnology', [tech, options]);")) {
  fs.writeFileSync(
    sourcePath,
    source.replace(
      "callNative('requestTechnology', [tech, options]);",
      "callNative('requestTechnology', [tech]);",
    ),
  );
}
