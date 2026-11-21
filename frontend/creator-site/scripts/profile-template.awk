# Builds profile.html from the site's index.html (run in frontend/Dockerfile).
#
# Everything between the "seo:start" and "seo:end" comments is replaced by a
# Caddy template call that includes the creator's own <title>, description
# and Open Graph tags from the backend. Caddy serves profile.html for
# /@username (see Caddyfile); the username comes from the path matcher.
/<!-- seo:start/ {
  print "    {{httpInclude (printf \"/api/v1/seo/profile-meta/%s\" (placeholder \"http.regexp.profile.1\"))}}"
  skip = 1
  next
}
/<!-- seo:end -->/ { skip = 0; next }
!skip
