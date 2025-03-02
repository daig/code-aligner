import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Aligner extension is now active');
    
    // Register the command
    let disposable = vscode.commands.registerCommand('code-aligner.alignCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        try {
            // Get alignment delimiters from user
            const delimitersInput = await vscode.window.showInputBox({
                prompt: 'Enter alignment delimiters separated by spaces (e.g., "operator ( =")',
                placeHolder: 'operator ( =',
                ignoreFocusOut: true
            });

            if (!delimitersInput) {
                return; // User canceled
            }

            const delimiters = delimitersInput.split(' ').filter((d: string) => d.length > 0);
            if (delimiters.length === 0) {
                vscode.window.showErrorMessage('No valid delimiters provided');
                return;
            }
            
            // Get selected text
            const selections = editor.selections;
            if (selections.length === 0 || selections[0].isEmpty) {
                vscode.window.showErrorMessage('No text selected');
                return;
            }

            // Apply the alignment
            await editor.edit((editBuilder: vscode.TextEditorEdit) => {
                // Process each selection separately
                for (const selection of selections) {
                    const text = editor.document.getText(selection);
                    const lines = text.split(/\r?\n/);
                    
                    // Align the lines
                    const alignedLines = alignLines(lines, delimiters);
                    
                    // Replace the selection with the aligned text
                    editBuilder.replace(selection, alignedLines.join('\n'));
                }
            });

            vscode.window.showInformationMessage('Code successfully aligned');
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
}

function alignLines(lines: string[], delimiters: string[]): string[] {
    if (delimiters.length === 0 || lines.length <= 1) {
        return lines;
    }

    // Create a copy of lines to work with
    let result = [...lines];

    // For each delimiter, align the code
    for (let delimIndex = 0; delimIndex < delimiters.length; delimIndex++) {
        const delimiter = delimiters[delimIndex];
        
        // Store positions where this delimiter appears in each line
        const positions = [];
        
        // For each line, find position of current delimiter
        for (let i = 0; i < result.length; i++) {
            let line = result[i];
            let position = -1;
            
            if (delimiter === "operator") {
                // Find "operator" keyword
                position = line.indexOf(delimiter);
            } else if (delimiter === "(") {
                // For parameters list opening parenthesis
                // Skip parentheses that are part of type expressions like std::size_t
                const operatorEnd = line.indexOf("operator") + "operator".length;
                if (operatorEnd > "operator".length - 1) {
                    // Find first opening parenthesis after "operator"
                    const parenAfterOperator = line.indexOf("(", operatorEnd);
                    if (parenAfterOperator !== -1) {
                        position = parenAfterOperator;
                    }
                } else {
                    // No operator found, look for first parenthesis
                    position = line.indexOf("(");
                }
            } else if (delimiter === "=") {
                // Find equals sign
                position = line.indexOf("=");
            } else {
                // Default case for other delimiters
                position = line.indexOf(delimiter);
            }
            
            positions.push(position);
        }
        
        // Find maximum position for alignment
        let maxPos = 0;
        for (const pos of positions) {
            if (pos > maxPos) {
                maxPos = pos;
            }
        }
        
        // Skip if no valid positions found
        if (maxPos === 0) continue;
        
        // Align each line based on the found positions
        for (let i = 0; i < result.length; i++) {
            if (positions[i] === -1) continue; // Skip lines without the delimiter
            
            const position = positions[i];
            const paddingNeeded = maxPos - position;
            
            if (paddingNeeded > 0) {
                // Insert padding before the delimiter
                const beforeDelimiter = result[i].substring(0, position);
                const afterDelimiter = result[i].substring(position);
                result[i] = beforeDelimiter + ' '.repeat(paddingNeeded) + afterDelimiter;
                
                // Adjust the positions of subsequent delimiters in this line
                // for further alignments in the next iterations
                for (let j = delimIndex + 1; j < delimiters.length; j++) {
                    const nextDelimiter = delimiters[j];
                    if (result[i].indexOf(nextDelimiter, position + paddingNeeded) !== -1) {
                        // The next delimiter will be found in its natural position
                        // when we process it in the next iteration
                    }
                }
            }
        }
    }
    
    return result;
}

export function deactivate() {} 