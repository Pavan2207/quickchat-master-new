Set-Location "c:\Users\pavan\Downloads\quickchat-master\quickchat-master"
Get-ChildItem . -Filter "*.env" -Recurse | ForEach-Object {
    Get-Content $_.FullName | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
}
npx convex deploy
