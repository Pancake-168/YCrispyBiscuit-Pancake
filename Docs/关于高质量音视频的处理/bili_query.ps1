# Bilibili WBI-signed API query helper (uses curl.exe for requests)
# Usage: .\bili_query.ps1 -Mid 21132494 -Ps 12 -Order pubdate
#        .\bili_query.ps1 -Mid BVxxxx -Mode info
#
# 登录凭证：优先读取本脚本同目录的 .bili_session.txt；
# 不存在则回退到 D:\res\AE\.bili_session.txt（仅本机开发用）。
# ⚠️ 安全警告：.bili_session.txt 内含 B 站登录凭证（SESSDATA），
#    切勿提交到 GitHub！请加入 .gitignore。

param(
  [Parameter(Mandatory=$true)][string]$Mid,
  [int]$Ps = 10,
  [int]$Pn = 1,
  [string]$Order = "pubdate",
  [string]$Mode = "list"
)

$ErrorActionPreference = "Stop"
$localSession = Join-Path $PSScriptRoot ".bili_session.txt"
if (Test-Path $localSession) {
  $cookieString = Get-Content $localSession -Raw
} elseif (Test-Path "D:\res\AE\.bili_session.txt") {
  $cookieString = Get-Content "D:\res\AE\.bili_session.txt" -Raw
} else {
  throw "未找到 .bili_session.txt（登录凭证）！请将其放在脚本同目录。"
}
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

function Invoke-BiliApi {
  param([string]$Url, [string]$Referer)
  $out = curl.exe -s -m 25 -H "User-Agent: $ua" -H "Cookie: $cookieString" -H "Referer: $Referer" $Url
  if ($LASTEXITCODE -ne 0) { throw "curl failed: $($LASTEXITCODE)" }
  return ($out -join "`n" | ConvertFrom-Json)
}

# WBI mixin key (img+sub permuted by mixinKeyEncTab, first 32 chars)
$mixinKeyEncTab = @(46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52)
$nav = Invoke-BiliApi -Url "https://api.bilibili.com/x/web-interface/nav" -Referer "https://www.bilibili.com/"
if ($nav.data.isLogin -ne $true) { Write-Warning "Not logged in! Some queries may fail." }
$img = [System.IO.Path]::GetFileNameWithoutExtension(($nav.data.wbi_img.img_url -split '\?')[0])
$sub = [System.IO.Path]::GetFileNameWithoutExtension(($nav.data.wbi_img.sub_url -split '\?')[0])
$raw = $img + $sub
$mixinKey = -join ($mixinKeyEncTab | Select-Object -First 32 | ForEach-Object { $raw[$_] })

function Get-WbiQuery {
  param([hashtable]$params, [string]$key)
  $p = @{}
  foreach ($k in $params.Keys) { $p[$k] = [string]$params[$k] }
  $p["wts"] = [string][int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $filtered = @{}
  foreach ($k in $p.Keys) {
    if ($p[$k] -match "[!'()*]") { continue }
    $filtered[$k] = $p[$k]
  }
  $sb = New-Object System.Text.StringBuilder
  foreach ($k in ($filtered.Keys | Sort-Object)) {
    if ($sb.Length -gt 0) { [void]$sb.Append("&") }
    [void]$sb.Append([Uri]::EscapeDataString($k)).Append("=").Append([Uri]::EscapeDataString($filtered[$k]))
  }
  $query = $sb.ToString()
  $md5 = [System.Security.Cryptography.MD5]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($query + $key)
  $hash = [System.BitConverter]::ToString($md5.ComputeHash($bytes)).Replace("-","").ToLower()
  return @{ query = $query; w_rid = $hash }
}

if ($Mode -eq "list") {
  $sig = Get-WbiQuery -params @{ mid = $Mid; ps = "$Ps"; pn = "$Pn"; order = $Order } -key $mixinKey
  $url = "https://api.bilibili.com/x/space/wbi/arc/search?$($sig.query)&w_rid=$($sig.w_rid)"
  $r = Invoke-BiliApi -Url $url -Referer "https://space.bilibili.com/$Mid/video"
  if ($r.code -ne 0) { throw "API error: code=$($r.code) msg=$($r.message)" }
  foreach ($v in $r.data.list.vlist) {
    $date = [DateTimeOffset]::FromUnixTimeSeconds($v.created).ToString('yyyy-MM-dd')
    "{0} | {1} | play={2} danmaku={3} | len={4} | {5}" -f $v.bvid, $v.title, $v.play, $v.video_review, $v.length, $date
  }
  "total in list: $($r.data.list.vlist.Count)"
} elseif ($Mode -eq "info") {
  $url = "https://api.bilibili.com/x/web-interface/view?bvid=$Mid"
  $r = Invoke-BiliApi -Url $url -Referer "https://www.bilibili.com/video/$Mid"
  if ($r.code -ne 0) { throw "API error: code=$($r.code) msg=$($r.message)" }
  $d = $r.data
  "bvid: $($d.bvid)"
  "title: $($d.title)"
  "desc: $($d.desc)"
  "duration: $($d.duration)s ($([TimeSpan]::FromSeconds($d.duration)))"
  "pubdate: $([DateTimeOffset]::FromUnixTimeSeconds($d.pubdate).ToString('yyyy-MM-dd HH:mm'))"
  "stats: play=$($d.stat.view) like=$($d.stat.like) coin=$($d.stat.coin) fav=$($d.stat.favorite) share=$($d.stat.share)"
  "pages:"
  foreach ($p in $d.pages) { "  - cid=$($p.cid) part=$($p.part) dur=$($p.duration)s" }
}
