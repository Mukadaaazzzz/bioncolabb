'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FiPlus, FiHome, FiSettings, FiLogOut, FiMenu, FiX, FiTarget, FiUsers } from 'react-icons/fi'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/ui/header'
import ColabCard from '@/components/dashboard/ColabCard'
import ChallengeCard from '@/components/dashboard/ChallengeCard'
import CreateColabModal from '@/components/dashboard/CreateColabModal'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [userColabs, setUserColabs] = useState<any[]>([])
  const [openColabs, setOpenColabs] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Fetch user's colabs
      const { data: colabData } = await supabase
        .from('colab_members')
        .select('colabs(*)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
      setUserColabs(colabData?.map((item: any) => item.colabs) || [])

      // Fetch all public colabs (Open Colabs)
      const { data: openColabData } = await supabase
        .from('colabs')
        .select('*, profiles(full_name, username)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6)
      setOpenColabs(openColabData || [])

      // Fetch challenges
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)
      setChallenges(challengeData || [])

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCreateColab = async (name: string, description: string, readme: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const { data, error } = await supabase
      .from('colabs')
      .insert([{
        name,
        slug,
        description,
        readme,
        owner_id: user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating colab:', error)
      return
    }

    // Add creator as owner
    await supabase
      .from('colab_members')
      .insert([{
        colab_id: data.id,
        user_id: user.id,
        role: 'owner',
        status: 'accepted'
      }])

    setUserColabs([data, ...userColabs])
    setShowCreateModal(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-all"
      >
        {sidebarOpen ? <FiX className="w-5 h-5 text-gray-700" /> : <FiMenu className="w-5 h-5 text-gray-700" />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 md:w-56 
        bg-white shadow-lg md:shadow-none border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center md:justify-start">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/biocol.png" 
                width={40} 
                height={40} 
                alt="Bioncolab Logo"
                className="w-10 h-10 md:w-8 md:h-8"
              />
              <span className="ml-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors hidden md:block">
                Bioncolab
              </span>
            </Link>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-medium">{(profile?.full_name || 'U')[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">@{profile?.username || 'username'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors shadow-sm text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Create Colab
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link
            href="#"
            className="flex items-center px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <FiHome className="mr-2 w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <FiSettings className="mr-2 w-4 h-4" />
            Settings
          </Link>
        </nav>
        
        {/* Logout Button */}
        <div className="p-3 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg text-sm"
          >
            <FiLogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome section */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Researcher'}!
              </h1>
              <p className="text-gray-600">Ready to tackle some challenges and collaborate?</p>
            </div>
            
            {/* Featured Challenges */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FiTarget className="text-red-600 w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Featured Challenges</h2>
                    <p className="text-gray-500 text-sm">Join the mission to solve critical healthcare challenges</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/challenges"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors flex items-center"
                  >
                    View all <FiPlus className="ml-1 w-3 h-3" />
                  </Link>
                  <Link
                    href="/challenges/create"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1"
                  >
                    <FiPlus className="w-3 h-3" />
                    Create
                  </Link>
                </div>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : challenges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FiTarget className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No challenges found</h3>
                  <p className="text-gray-500 mb-4 text-sm">Be the first to create a challenge for the community</p>
                  <Link
                    href="/challenges/create"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-1"
                  >
                    <FiPlus className="w-3 h-3" />
                    Create challenge
                  </Link>
                </div>
              )}
            </div>
            
            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Colabs */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiUsers className="text-blue-600 w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Your Colabs</h2>
                  </div>
                  {userColabs.length > 0 && (
                    <Link href="/colabs" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View all
                    </Link>
                  )}
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : userColabs.length > 0 ? (
                  <div className="space-y-3">
                    {userColabs.slice(0, 4).map(colab => (
                      <ColabCard key={colab.id} colab={colab}  />
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No colabs yet</h3>
                    <p className="text-gray-500 mb-4 text-sm">Start collaborating with researchers worldwide</p>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      Create colab
                    </button>
                  </div>
                )}
              </div>
              
              {/* Open Colabs */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiUsers className="text-green-600 w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Open Colabs</h2>
                  </div>
                  <Link href="/colabs/explore" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Explore all
                  </Link>
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : openColabs.length > 0 ? (
                  <div className="space-y-3">
                    {openColabs.slice(0, 3).map(colab => (
                      <div key={colab.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                            {colab.profiles?.avatar_url ? (
                              <img src={colab.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-white">{(colab.profiles?.full_name || 'U')[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{colab.profiles?.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{new Date(colab.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <h3 className="text-md font-semibold text-blue-600 hover:text-blue-700 mb-1">
                          <Link href={`/colab/${colab.slug}`}>{colab.name}</Link>
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{colab.description}</p>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">Open Source</span>
                          <span className="text-gray-500">0 contributors</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mx-auto mb-4 flex items-center justify-center">
                      <FiUsers className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No open colabs</h3>
                    <p className="text-gray-500 text-sm">Check back later for collaboration opportunities</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Colab Modal */}
      {showCreateModal && (
        <CreateColabModal 
          onCloseAction={() => setShowCreateModal(false)}
          onCreateAction={handleCreateColab}
        />
      )}
    </div>
  )
}