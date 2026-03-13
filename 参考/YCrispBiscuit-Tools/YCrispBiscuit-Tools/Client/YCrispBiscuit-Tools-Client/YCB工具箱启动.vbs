Dim WshShell, objFSO, strScriptDir, strBatPath
Set WshShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 获取当前脚本的目录
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' 批处理文件路径
strBatPath = strScriptDir & "\启动开发环境.bat"

' 检查批处理文件是否存在
If objFSO.FileExists(strBatPath) Then
    ' 运行批处理文件，隐藏窗口
    WshShell.Run chr(34) & strBatPath & Chr(34), 0
Else
    ' 如果没有批处理文件，直接运行npm命令
    WshShell.Run "cmd /c cd /d """ & strScriptDir & """ && npm run electron-dev", 0
End If

Set WshShell = Nothing
Set objFSO = Nothing
