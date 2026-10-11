import sys

path = "/etc/nginx/user_auth_verification.lua"
with open(path, "r") as f:
    content = f.read()

target = 'if ngx.var.host == "localhost" then\n  return\nend'
replacement = """if ngx.var.host == "localhost" then
  return
end

-- Allow direct public customer access:
-- Bypass auth bridge for all non-admin routes (Customer Order Page, Tracking, Catalog, APIs, Assets)
local req_uri = ngx.var.uri or ""
local is_admin_request = string.match(req_uri, "^/admin") or string.match(req_uri, "^/owner") or ngx.var.arg_admin == "true" or ngx.var.arg_panel == "admin" or ngx.var.arg_owner == "true"

if not is_admin_request then
  -- Direct public access for all customers on WhatsApp, Android, iPhone, and desktop
  return
end"""

if target in content:
    new_content = content.replace(target, replacement, 1)
    with open(path, "w") as f:
        f.write(new_content)
    print("SUCCESSFULLY_PATCHED_LUA")
else:
    print("TARGET_NOT_FOUND")
