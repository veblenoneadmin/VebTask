'use client'

import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'

export default function Home() {
  const { user, isSignedIn } = useUser()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  
  const tasks = useQuery(api.tasks.list, 
    isSignedIn && user ? { userId: user.id } : 'skip'
  )
  
  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const removeTask = useMutation(api.tasks.remove)

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !user) return
    
    await createTask({
      title: newTaskTitle,
      userId: user.id,
    })
    
    setNewTaskTitle('')
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    await updateTask({
      id: taskId as any,
      completed: !completed,
    })
  }

  const deleteTask = async (taskId: string) => {
    await removeTask({ id: taskId as any })
  }

  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">OrbiTask AI</h1>
          <p className="text-lg mb-8">AI-powered task management</p>
          <SignInButton>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
              Sign In
            </button>
          </SignInButton>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">OrbiTask AI</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
            <SignOutButton>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Add Task
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {tasks?.map((task) => (
            <div
              key={task._id}
              className="flex items-center gap-4 p-4 bg-white rounded-lg shadow border"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task._id, task.completed)}
                className="w-5 h-5"
              />
              <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task._id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {tasks?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tasks yet. Create your first task above!
          </div>
        )}
      </div>
    </main>
  )
}