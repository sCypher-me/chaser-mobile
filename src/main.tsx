import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { loadDataset } from '@/data/loader'
import { createAppRouter } from '@/app/app'
import '@/styles/index.css'

const loaded = await loadDataset()
const router = createAppRouter(loaded)
createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router}/></StrictMode>)
