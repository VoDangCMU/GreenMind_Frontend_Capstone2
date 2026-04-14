"use client"

import { useState, useEffect, useCallback } from "react"
import {
  fetchBlogs,
  fetchLeaderboard,
  createBlog,
  updateBlog,
  deleteBlog,
  fetchBlogById,
  addComment,
  Blog,
  BlogComment,
  LeaderboardUser,
} from "@/services/blog.service"
import { getAccessToken } from "@/lib/auth"
import { BlogCard } from "@/components/blog/BlogCard"
import { Leaderboard } from "@/components/blog/Leaderboard"
import { CommentSection } from "@/components/blog/CommentSection"

const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, userId: "mock-1", fullName: "Nguyễn Bá Khoa", username: "nguyenkhoa", reportCount: 47 },
  { rank: 2, userId: "mock-2", fullName: "Võ Thị Đăng", username: "vodang", reportCount: 35 },
  { rank: 3, userId: "mock-3", fullName: "Trần Minh Đức", username: "tranmduc", reportCount: 28 },
  { rank: 4, userId: "mock-4", fullName: "Lê Thị Thu Hằng", username: "lethuhang", reportCount: 21 },
  { rank: 5, userId: "mock-5", fullName: "Phạm Quốc Bảo", username: "phamqbao", reportCount: 17 },
  { rank: 6, userId: "mock-6", fullName: "Hoàng Thị Lan", username: "hoanglan", reportCount: 14 },
  { rank: 7, userId: "mock-7", fullName: "Nguyen Van Thanh", username: "nvthanh", reportCount: 11 },
  { rank: 8, userId: "mock-8", fullName: "Bùi Thị Mai", username: "buimai", reportCount: 9 },
  { rank: 9, userId: "mock-9", fullName: "Do Xuan Truong", username: "dxtruong", reportCount: 7 },
  { rank: 10, userId: "mock-10", fullName: "Trần Thị Kim Chi", username: "kimchi", reportCount: 5 },
]
import { BlogEditor } from "@/components/blog/BlogEditor"
import { formatDistanceToNow } from "date-fns"

type View = "list" | "detail" | "compose"

export default function BlogsPage() {
  const [view, setView] = useState<View>("list")
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(MOCK_LEADERBOARD)
  const [leaderboardIsMock, setLeaderboardIsMock] = useState(true)
  const [activeBlog, setActiveBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Compose state
  const [editBlog, setEditBlog] = useState<Blog | null>(null)
  const [composeTitle, setComposeTitle] = useState("")
  const [composeContent, setComposeContent] = useState("")
  const [composeTags, setComposeTags] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const isLoggedIn = !!getAccessToken()

  const loadBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchBlogs(page, 9, search || undefined)
      setBlogs(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch {
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadBlogs()
  }, [loadBlogs])

  useEffect(() => {
    fetchLeaderboard()
      .then((data) => {
        if (data && data.length > 0) {
          setLeaderboard(data)
          setLeaderboardIsMock(false)
        }
        // else: keep mock data
      })
      .catch(() => {
        // keep mock data on error
      })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const openBlog = async (blog: Blog) => {
    try {
      const full = await fetchBlogById(blog.id)
      setActiveBlog(full)
    } catch {
      setActiveBlog(blog)
    }
    setView("detail")
  }

  const openCompose = (blog?: Blog) => {
    if (blog) {
      setEditBlog(blog)
      setComposeTitle(blog.title)
      setComposeContent(blog.content)
      setComposeTags(blog.tags?.join(", ") ?? "")
    } else {
      setEditBlog(null)
      setComposeTitle("")
      setComposeContent("")
      setComposeTags("")
    }
    setView("compose")
  }

  const handleSave = async () => {
    if (!composeTitle.trim() || !composeContent.trim()) {
      setSaveMsg("Title and content are required.")
      return
    }
    setSaving(true)
    setSaveMsg(null)
    try {
      const tags = composeTags.split(",").map((t) => t.trim()).filter(Boolean)
      const payload = { title: composeTitle.trim(), content: composeContent, tags }

      if (editBlog) {
        await updateBlog(editBlog.id, payload)
        setSaveMsg("Post updated successfully.")
      } else {
        await createBlog(payload)
        setSaveMsg("Post published successfully.")
      }
      setTimeout(() => { setView("list"); loadBlogs() }, 1000)
    } catch {
      setSaveMsg("Failed to save post.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    try {
      await deleteBlog(blogId)
      setView("list")
      loadBlogs()
    } catch {
      alert("Failed to delete post.")
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-xl mx-auto">

      {/* ═══ LIST VIEW ═══ */}
      {view === "list" && (
        <>
          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Community</h1>
              <p className="text-muted-foreground text-sm">Share knowledge about environmental protection</p>
            </div>
            {isLoggedIn && (
              <button
                id="btn-new-blog"
                onClick={() => openCompose()}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                New Post
              </button>
            )}
          </div>

          {/* Two-column layout: 1/4 leaderboard | 3/4 blog content */}
          <div className="flex gap-6 items-start">

            {/* ── LEFT: Leaderboard (sticky) ── */}
            <div className="w-1/4 shrink-0 sticky top-6">
              <Leaderboard leaderboard={leaderboard} />
            </div>

            {/* ── RIGHT: Search + Grid + Pagination ── */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  id="blog-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search posts..."
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  Search
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setSearchInput(""); setPage(1) }}
                    className="rounded-xl border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* Blog grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : blogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <p className="text-lg font-semibold">No posts yet</p>
                  <p className="text-sm mt-1">Be the first to share something!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {blogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} onClick={openBlog} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ DETAIL VIEW ═══ */}
      {view === "detail" && activeBlog && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={() => setView("list")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to posts
            </button>
            {isLoggedIn && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openCompose(activeBlog)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(activeBlog.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <article className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-7 space-y-5">
              {/* Tags */}
              {activeBlog.tags && activeBlog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeBlog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-2xl font-bold text-foreground leading-tight">{activeBlog.title}</h1>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{activeBlog.author?.fullName || activeBlog.author?.username || "Anonymous"}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(activeBlog.createdAt), { addSuffix: true })}</span>
                <span>·</span>
                <span>{activeBlog.like_count} likes</span>
                <span>·</span>
                <span>{activeBlog.comment_count ?? 0} comments</span>
              </div>

              <hr className="border-border" />

              {/* HTML content — images rendered with lazy loading (as set during creation) */}
              <div
                className="prose prose-sm max-w-none text-foreground
                  [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 [&_img]:shadow-sm
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                  [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                  [&_a]:text-emerald-600 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: activeBlog.content }}
              />
            </div>
          </article>

          {/* ── Comment Section ── */}
          <CommentSection blog={activeBlog} setBlog={setActiveBlog} />
        </div>
      )}

      {/* ═══ COMPOSE VIEW ═══ */}
      {view === "compose" && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setView("list")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Cancel
            </button>
            <h2 className="text-xl font-bold text-foreground">
              {editBlog ? "Edit Post" : "New Post"}
            </h2>
            <button
              id="btn-save-blog"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              {saving ? "Saving..." : editBlog ? "Update" : "Publish"}
            </button>
          </div>

          {saveMsg && (
            <div
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${saveMsg.toLowerCase().includes("fail") || saveMsg.toLowerCase().includes("required")
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
            >
              {saveMsg}
            </div>
          )}

          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="compose-title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="compose-title"
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                placeholder="Post title..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="compose-tags">
                Tags <span className="text-muted-foreground font-normal">(comma-separated)</span>
              </label>
              <input
                id="compose-tags"
                value={composeTags}
                onChange={(e) => setComposeTags(e.target.value)}
                placeholder="environment, recycling, sustainability..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Content <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Paste or drag an image directly into the editor to upload it automatically.
              </p>
              <BlogEditor value={composeContent} onChange={setComposeContent} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
