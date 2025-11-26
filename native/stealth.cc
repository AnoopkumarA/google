#include <napi.h>
#include <cstring>

#ifdef _WIN32
#include <windows.h>

// Windows API constant for excluding window from screen capture
#define WDA_EXCLUDEFROMCAPTURE 0x11
#define WDA_NONE 0x00

// Set window display affinity to prevent screen capture
Napi::Value SetWindowStealth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Validate argument count
  if (info.Length() < 2) {
    throw Napi::TypeError::New(env, "Expected 2 arguments: Buffer (hwnd) and Boolean (enable)");
  }
  
  // Validate first argument is a Buffer
  if (!info[0].IsBuffer()) {
    throw Napi::TypeError::New(env, "Argument 0 must be a Buffer containing the window handle (HWND)");
  }
  
  // Validate second argument is a Boolean
  if (!info[1].IsBoolean()) {
    throw Napi::TypeError::New(env, "Argument 1 must be a Boolean");
  }
  
  try {
    // Extract the window handle from the buffer
    Napi::Buffer<unsigned char> handleBuffer = info[0].As<Napi::Buffer<unsigned char>>();
    
    // Ensure buffer is large enough to hold an HWND pointer
    if (handleBuffer.Length() < sizeof(HWND)) {
      throw Napi::TypeError::New(env, "Buffer must be at least " + std::to_string(sizeof(HWND)) + " bytes");
    }
    
    // Safely copy the window handle from the buffer
    HWND hwnd = NULL;
    std::memcpy(&hwnd, handleBuffer.Data(), sizeof(HWND));
    
    // Validate the window handle
    if (hwnd == NULL || !IsWindow(hwnd)) {
      return Napi::Boolean::New(env, false);
    }
    
    // Get the enable flag (true = exclude from capture, false = normal)
    bool enable = info[1].As<Napi::Boolean>();
    
    // Apply the window display affinity setting
    DWORD dwAffinity = enable ? WDA_EXCLUDEFROMCAPTURE : WDA_NONE;
    BOOL result = SetWindowDisplayAffinity(hwnd, dwAffinity);
    
    if (!result) {
      // GetLastError would provide more details if needed for debugging
      return Napi::Boolean::New(env, false);
    }
    
    return Napi::Boolean::New(env, true);
  } catch (const std::exception& e) {
    throw Napi::Error::New(env, std::string("Native error: ") + e.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error in setWindowStealth");
  }
}

#else

// Stub implementation for non-Windows platforms
Napi::Value SetWindowStealth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  // Return false on non-Windows platforms since this feature is Windows-only
  return Napi::Boolean::New(env, false);
}

#endif

// Initialize the native module
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(
    Napi::String::New(env, "setWindowStealth"),
    Napi::Function::New(env, SetWindowStealth)
  );
  return exports;
}

NODE_API_MODULE(stealth, Init)
