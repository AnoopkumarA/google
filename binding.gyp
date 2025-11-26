{
  "targets": [
    {
      "target_name": "stealth",
      "sources": ["native/stealth.cc"],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include_dir\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags!": ["-fno-exceptions"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LANGUAGE_DIALECT": "c++14",
        "CLANG_CXX_LIBRARY": "libc++"
      },
      "conditions": [
        ["OS=='win'", {
          "libraries": ["user32.lib", "kernel32.lib"],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": ["/std:c++17", "/EHsc"]
            }
          }
        }]
      ]
    }
  ]
}
