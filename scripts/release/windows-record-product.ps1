param([int]$DebugPort = 9222)

$ErrorActionPreference = "Stop"
$target = (Invoke-RestMethod "http://127.0.0.1:$DebugPort/json/list") |
  Where-Object { $_.type -eq "page" -and $_.url -like "https://bulbasour-503317.web.app/*" } |
  Select-Object -First 1
if (-not $target) { throw "ActionOS capture tab not found" }

$socket = [System.Net.WebSockets.ClientWebSocket]::new()
$cancel = [Threading.CancellationToken]::None
$socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, $cancel).GetAwaiter().GetResult()
$script:messageId = 0

function Invoke-Cdp([string]$method, [hashtable]$params = @{}) {
  $script:messageId += 1
  $wanted = $script:messageId
  $payload = @{ id = $wanted; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 12
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $socket.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, $cancel).GetAwaiter().GetResult()
  while ($true) {
    $memory = [IO.MemoryStream]::new()
    do {
      $buffer = New-Object byte[] 65536
      $result = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), $cancel).GetAwaiter().GetResult()
      $memory.Write($buffer, 0, $result.Count)
    } while (-not $result.EndOfMessage)
    $message = [Text.Encoding]::UTF8.GetString($memory.ToArray()) | ConvertFrom-Json
    if ($message.id -eq $wanted) {
      if ($message.error) { throw ($message.error | ConvertTo-Json -Compress) }
      return $message.result
    }
  }
}

function Eval([string]$expression) {
  $answer = Invoke-Cdp "Runtime.evaluate" @{ expression = $expression; returnByValue = $true; awaitPromise = $true }
  return $answer.result.value
}

function Wait-Text([string]$text, [int]$seconds = 60) {
  $escaped = $text.Replace("\", "\\").Replace("'", "\'")
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    if (Eval "document.body.innerText.includes('$escaped')") { return }
    Start-Sleep -Milliseconds 250
  }
  throw "Timed out waiting for: $text"
}

function Click-Text([string]$selector, [string]$text) {
  $escaped = $text.Replace("\", "\\").Replace("'", "\'")
  $clicked = Eval "(()=>{const e=[...document.querySelectorAll('$selector')].find(x=>x.textContent.includes('$escaped'));if(!e)return false;e.scrollIntoView({block:'center'});e.click();return true})()"
  if (-not $clicked) { throw "Element not found: $text" }
}

Invoke-Cdp "Page.bringToFront" | Out-Null
Invoke-Cdp "Page.navigate" @{ url = "https://bulbasour-503317.web.app/en" } | Out-Null
Wait-Text "Stop chasing companies" 30
Eval "window.scrollTo(0,0);true" | Out-Null
Start-Sleep -Seconds 3
Click-Text "a" "Hand off a follow-up"
Start-Sleep -Seconds 2
Click-Text "button" "Missing refund"
Start-Sleep -Seconds 2
Click-Text "button" "Build my plan"
Start-Sleep -Seconds 4
Wait-Text "Review what ActionOS understood." 75
Eval "window.scrollTo({top:170,behavior:'smooth'});true" | Out-Null
Start-Sleep -Seconds 5
Eval "(()=>{const e=document.querySelector('input[type=checkbox]');e.scrollIntoView({block:'center'});return true})()" | Out-Null
Start-Sleep -Seconds 4
Eval "document.querySelector('input[type=checkbox]').click();true" | Out-Null
Start-Sleep -Seconds 2
Click-Text "button" "Approve and start follow-up"
Wait-Text "The reply did not prove the promised outcome" 20
Start-Sleep -Seconds 4
Wait-Text "Company confirmed the refund instruction" 25
Eval "window.scrollTo(0,0);true" | Out-Null
Start-Sleep -Seconds 6
Click-Text "button" "Show technical trace"
Start-Sleep -Seconds 3
Eval "(()=>{const e=[...document.querySelectorAll('section')].find(x=>x.textContent.includes('How ActionOS ran'));e.scrollIntoView({block:'start'});return true})()" | Out-Null
Start-Sleep -Seconds 8
Write-Output "CAPTURE_FLOW_COMPLETE"
