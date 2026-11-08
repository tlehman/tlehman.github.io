-- Pandoc filter: fill in social-card metadata for writing/<slug>/index.md.
--
-- Sets, unless the post's front matter already gives them:
--   card_url          https://tobilehman.com/writing/<slug>/
--   card_image        absolute URL of the post's first image (none -> no image)
--   card_description  the first paragraph as plain text, trimmed to ~200 chars
--
-- template.html turns these into Open Graph and Twitter card tags, which is
-- what X, iMessage, Slack, Discord, etc. read for link previews. To pick a
-- different picture or blurb, set `image:` or `description:` in front matter.
-- Run from the post's own directory (regenerate.sh and the editor do).

local SITE = "https://tobilehman.com"

local function slug()
  local cwd = pandoc.system.get_working_directory()
  return cwd:match("([^/]+)/*$")
end

local function absolute(src, base)
  if src:match("^https?://") then return src end
  if src:sub(1, 1) == "/" then return SITE .. src end
  src = src:gsub("^%./", "")
  return base .. src
end

-- Raw HTML-escaped strings, so pandoc doesn't line-wrap them inside attributes.
local function raw(text)
  text = text:gsub("&", "&amp;"):gsub('"', "&quot;"):gsub("<", "&lt;"):gsub(">", "&gt;")
  return pandoc.MetaInlines({ pandoc.RawInline("html", text) })
end

-- Plain-text stand-ins for TeX that shows up in opening paragraphs.
local TEX = { infty = "∞", pi = "π", to = "→", le = "≤", ge = "≥", cdot = "·", times = "×" }

local function plain(blocks)
  blocks = blocks:walk({
    Math = function(m)
      return pandoc.Str((m.text:gsub("\\(%a+)", function(c) return TEX[c] or c end)))
    end,
  })
  return pandoc.utils.stringify(blocks)
end

local function trim(text, limit)
  text = text:gsub("%s+", " "):gsub("^ ", ""):gsub(" $", "")
  if #text <= limit then return text end
  local cut = text:sub(1, limit):gsub("%s+%S*$", "")
  return cut .. "…"
end

function Pandoc(doc)
  local meta = doc.meta
  local base = SITE .. "/writing/" .. slug() .. "/"
  meta.card_url = raw(base)
  if meta.title then meta.card_title = raw(pandoc.utils.stringify(meta.title)) end

  local image = meta.image and pandoc.utils.stringify(meta.image)
  local description = meta.description and pandoc.utils.stringify(meta.description)

  doc:walk({
    Image = function(img)
      if not image then image = img.src end
    end,
    Para = function(para)
      if not description then
        local text = plain(pandoc.Blocks({ para }))
        if text:match("%S") then description = text end
      end
    end,
  })

  if image then meta.card_image = raw(absolute(image, base)) end
  if description then meta.card_description = raw(trim(description, 200)) end
  return doc
end
