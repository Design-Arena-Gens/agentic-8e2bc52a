'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [currentTags, setCurrentTags] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('notes')
    if (stored) {
      setNotes(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  }, [notes])

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags))).sort()

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => note.tags.includes(tag))

    return matchesSearch && matchesTags
  }).sort((a, b) => b.updatedAt - a.updatedAt)

  const saveNote = () => {
    if (!title.trim() && !content.trim()) return

    if (editingNote) {
      setNotes(notes.map(note =>
        note.id === editingNote.id
          ? { ...note, title, content, tags: currentTags, updatedAt: Date.now() }
          : note
      ))
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title,
        content,
        tags: currentTags,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      setNotes([newNote, ...notes])
    }

    resetForm()
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const editNote = (note: Note) => {
    setEditingNote(note)
    setTitle(note.title)
    setContent(note.content)
    setCurrentTags([...note.tags])
    setIsCreating(true)
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCurrentTags([])
    setTagInput('')
    setIsCreating(false)
    setEditingNote(null)
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !currentTags.includes(tag)) {
      setCurrentTags([...currentTags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setCurrentTags(currentTags.filter(t => t !== tag))
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
    )
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isCreating) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={resetForm} className={styles.cancelBtn}>Cancel</button>
          <h1 className={styles.headerTitle}>{editingNote ? 'Edit Note' : 'New Note'}</h1>
          <button onClick={saveNote} className={styles.saveBtn}>Save</button>
        </div>

        <div className={styles.editor}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
            autoFocus
          />

          <textarea
            placeholder="Start typing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.contentInput}
          />

          <div className={styles.tagSection}>
            <div className={styles.tagInputWrapper}>
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className={styles.tagInput}
              />
              <button onClick={addTag} className={styles.addTagBtn}>Add</button>
            </div>

            <div className={styles.tagList}>
              {currentTags.map(tag => (
                <div key={tag} className={styles.tag}>
                  {tag}
                  <button onClick={() => removeTag(tag)} className={styles.removeTag}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.appTitle}>Notes</h1>
      </div>

      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {allTags.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.tagFilters}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`${styles.filterTag} ${selectedTags.includes(tag) ? styles.filterTagActive : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.notesList}>
        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchQuery || selectedTags.length > 0 ? 'No notes found' : 'No notes yet'}</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} className={styles.noteCard} onClick={() => editNote(note)}>
              <div className={styles.noteHeader}>
                <h3 className={styles.noteTitle}>{note.title || 'Untitled'}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNote(note.id)
                  }}
                  className={styles.deleteBtn}
                >
                  ×
                </button>
              </div>
              <p className={styles.noteContent}>
                {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
              </p>
              <div className={styles.noteFooter}>
                <div className={styles.noteTags}>
                  {note.tags.map(tag => (
                    <span key={tag} className={styles.noteTag}>{tag}</span>
                  ))}
                </div>
                <span className={styles.noteDate}>{formatDate(note.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <button onClick={() => setIsCreating(true)} className={styles.fab}>
        +
      </button>
    </div>
  )
}
