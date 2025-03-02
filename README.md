# Code Aligner

A Visual Studio Code extension for aligning code along specified delimiters.

## Features

This extension allows you to select multiple lines of code and align them based on specified delimiters. For example, you can align code along operators, parentheses, equal signs, or any other delimiter you specify.

### Example

Before alignment:
```
void* operator new(std::size_t size) = delete;
void operator delete(void* ptr) noexcept = delete;
void* operator new[](std::size_t size) = delete;
void operator delete[](void* ptr) noexcept = delete;
void operator delete(void* ptr, std::size_t) noexcept = delete;
void operator delete[](void* ptr, std::size_t) noexcept = delete;
```


After alignment with delimiters "operator ( noexcept =":
```
void* operator new     (std::size_t size)                = delete;
void  operator delete  (void* ptr)              noexcept = delete;
void* operator new[]   (std::size_t size)                = delete;
void  operator delete[](void* ptr)              noexcept = delete;
void  operator delete  (void* ptr, std::size_t) noexcept = delete;
void  operator delete[](void* ptr, std::size_t) noexcept = delete;
```


## Usage

1. Select the lines of code you want to align
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and select "Align Code"
3. Enter the delimiters to align with, separated by spaces (e.g., "operator ( =")
4. The selected code will be aligned according to the specified delimiters

## Installation

### From source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the extension
4. Copy the extension folder to your VSCode extensions folder:
   - Windows: `%USERPROFILE%\.vscode\extensions`
   - Mac/Linux: `~/.vscode/extensions`
5. Restart VSCode

## Building the Extension
To build the extension:

```bash
cd code-aligner
npm install
npm run compile
```

## Packaging the Extension
To create a .vsix package for installation:

```bash
npm install -g vsce
vsce package
```

This will create a .vsix file that can be installed via the VSCode Extensions view. 