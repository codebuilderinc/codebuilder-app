const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get the app package name
function getPackageName() {
  try {
    const appJson = JSON.parse(fs.readFileSync("./app.json", "utf8"));
    return (
      appJson.expo.android?.package || "com.codebuilderinc.codebuilderapps"
    );
  } catch (error) {
    console.error("Error getting package name:", error);
    return "com.codebuilderinc.codebuilderapps"; // Fallback
  }
}

// Setup the TS global handler that works with your actual error service
function setupTSErrorHandler() {
  console.log("📱 Setting up TypeScript global error handler...");

  const utilsDir = path.join("src", "utils");
  const handlerPath = path.join(utilsDir, "errorHandler.ts");

  // Create utils directory if it doesn't exist
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }

  // Content for the error handler that uses your actual error reporting service
  const handlerContent = `
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import { Alert } from 'react-native';
import { errorReportingService } from '../services/errorReporting.service';

// JavaScript Error Handler
export const setupGlobalErrorHandlers = () => {
  setJSExceptionHandler((error, isFatal) => {
    // Log the error to your existing error reporting service
    errorReportingService.submitError?.(error) || 
    errorReportingService.reportError?.(error) ||
    console.error('Caught JS Exception:', error);
    
    // Show a friendly message instead of crashing
    Alert.alert(
      'Unexpected Error Occurred',
      'We encountered an issue. The app will continue running, and our team has been notified.',
      [{ text: 'OK' }]
    );
  }, true);

  // Native Exception Handler
  setNativeExceptionHandler(
    (exceptionString) => {
      // Handle native exceptions
      const error = new Error(\`Native Exception: \${exceptionString}\`);
      errorReportingService.submitError?.(error) || 
      errorReportingService.reportError?.(error) ||
      console.error('Caught Native Exception:', exceptionString);
    },
    false, // don't force app to quit
    true // should catch all exceptions
  );
};
`;

  // Write the file
  fs.writeFileSync(handlerPath, handlerContent);
  console.log(`✅ Created error handler at ${handlerPath}`);
}

// Setup the Android native exception handler
function setupNativeExceptionHandler() {
  console.log("📱 Setting up Android native exception handler...");

  // Get package name and calculate path
  const packageName = getPackageName();
  const packagePath = packageName.replace(/\./g, "/");

  // Path to MainActivity.java
  const mainActivityPath = path.join(
    "android",
    "app",
    "src",
    "main",
    "java",
    packagePath,
    "MainActivity.java"
  );

  // Check if file exists
  if (!fs.existsSync(mainActivityPath)) {
    console.log(
      `❌ MainActivity.java not found at ${mainActivityPath}. Run 'npx expo prebuild' first.`
    );
    return;
  }

  // Read the file
  let mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

  // Check if we've already modified this file
  if (mainActivityContent.includes("// CUSTOM EXCEPTION HANDLER")) {
    console.log("✅ Exception handler already set up in MainActivity.java");
    return;
  }

  // Find the onCreate method or prepare to add it
  const onCreateRegex =
    /protected void onCreate\s*\(\s*Bundle savedInstanceState\s*\)\s*\{/;
  const hasOnCreate = onCreateRegex.test(mainActivityContent);

  let exceptionHandlerCode;

  if (hasOnCreate) {
    // Append to existing onCreate method
    exceptionHandlerCode = `
    // CUSTOM EXCEPTION HANDLER
    final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
    Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
      @Override
      public void uncaughtException(Thread thread, Throwable throwable) {
        // Log the exception but don't crash the app
        System.err.println("Caught unhandled exception: " + throwable.getMessage());
        throwable.printStackTrace();
        
        // Don't call the default handler to prevent crash screen
        // defaultHandler.uncaughtException(thread, throwable);
      }
    });`;

    // Insert the code after the opening brace of onCreate
    mainActivityContent = mainActivityContent.replace(
      onCreateRegex,
      `protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);${exceptionHandlerCode}`
    );
  } else {
    // Need to add the entire onCreate method
    exceptionHandlerCode = `
  // CUSTOM EXCEPTION HANDLER
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
    Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
      @Override
      public void uncaughtException(Thread thread, Throwable throwable) {
        // Log the exception but don't crash the app
        System.err.println("Caught unhandled exception: " + throwable.getMessage());
        throwable.printStackTrace();
        
        // Don't call the default handler to prevent crash screen
        // defaultHandler.uncaughtException(thread, throwable);
      }
    });
  }
`;

    // Add the import for Bundle if needed
    if (!mainActivityContent.includes("import android.os.Bundle;")) {
      mainActivityContent = mainActivityContent.replace(
        "import com.facebook.react.ReactActivity;",
        "import com.facebook.react.ReactActivity;\nimport android.os.Bundle;"
      );
    }

    // Find the closing brace of the class and insert before it
    const lastBraceIndex = mainActivityContent.lastIndexOf("}");
    mainActivityContent =
      mainActivityContent.substring(0, lastBraceIndex) +
      exceptionHandlerCode +
      mainActivityContent.substring(lastBraceIndex);
  }

  // Write the modified file
  fs.writeFileSync(mainActivityPath, mainActivityContent);
  console.log("✅ Exception handler successfully added to MainActivity.java");
}

// Run both setup functions
function setupExceptionHandlers() {
  // Setup the JS error handler utility
  setupTSErrorHandler();

  // Setup the native Android exception handler
  setupNativeExceptionHandler();

  // Reminder for necessary package
  console.log(`
🔔 Next steps:
1. Add 'react-native-exception-handler' to your dependencies:
   npm install react-native-exception-handler
   
2. Import and use the handler in your _layout.tsx:
   import { setupGlobalErrorHandlers } from '../src/utils/errorHandler';
   
   // Add inside a useEffect:
   useEffect(() => {
     setupGlobalErrorHandlers();
   }, []);
  `);
}

// Run the function if this is the main module
if (require.main === module) {
  setupExceptionHandlers();
}

module.exports = setupExceptionHandlers;
