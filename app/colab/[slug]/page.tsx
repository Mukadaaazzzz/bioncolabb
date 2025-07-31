'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { FiHome, FiGitBranch, FiCpu, FiTerminal, FiUsers, FiDatabase, FiPlus, FiX, FiCalendar, FiEye, FiLock, FiGlobe, FiArrowLeft, FiStar, FiMessageCircle, FiActivity, FiMenu } from 'react-icons/fi'

interface Colab {
  id: string
  name: string
  slug: string
  description: string
  readme: string
  is_public: boolean
  owner_id: string
}

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string
  role: string
}

interface Contribution {
  id: string
  colab_id: string
  user: Profile
  description: string
  created_at: string
}

interface ResearchNote {
  id: string
  colab_id: string
  user: Profile
  content: string
  created_at: string
}


export default function ColabPage() {
  const [colab, setColab] = useState<Colab | null>(null)
  const [creator, setCreator] = useState<Profile | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [researchNotes, setResearchNotes] = useState<ResearchNote[]>([])
  const [currentSection, setCurrentSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContributionModal, setShowContributionModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { slug } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return

      setLoading(true)
      try {
        // Check authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/signin')
          return
        }

        // Fetch colab data
        const { data: colabData, error: colabError } = await supabase
          .from('colabs')
          .select('*')
          .eq('slug', slug)
          .single()

        if (colabError || !colabData) {
          throw new Error(colabError?.message || 'Colab not found')
        }

        setColab(colabData as Colab)

        // Fetch creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, role')
          .eq('id', colabData.owner_id)
          .single()

        if (creatorError) {
          console.error('Error fetching creator:', creatorError)
          setCreator(null)
        } else {
          setCreator(creatorData as Profile)
        }

        // Fetch user role
        const { data: memberData, error: memberError } = await supabase
          .from('colab_members')
          .select('role')
          .eq('colab_id', colabData.id)
          .eq('user_id', user.id)
          .single()

        if (memberError && memberError.code !== 'PGRST116') {
          console.error('Error fetching user role:', memberError)
        }
        setUserRole(memberData?.role || null)

        // Fetch contributions
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributions')
          .select('*, user:profiles(id, username, full_name, avatar_url)')
          .eq('colab_id', colabData.id)
          .order('created_at', { ascending: false })

        if (contributionsError) {
          console.error('Error fetching contributions:', contributionsError)
        } else if (contributionsData) {
          setContributions(contributionsData as Contribution[])
        }

        // Fetch research notes
        const { data: notesData, error: notesError } = await supabase
          .from('research_notes')
          .select('*, user:profiles(id, username, full_name, avatar_url)')
          .eq('colab_id', colabData.id)
          .order('created_at', { ascending: false })

        if (notesError) {
          console.error('Error fetching research notes:', notesError)
        } else if (notesData) {
          setResearchNotes(notesData as ResearchNote[])
        }
      } catch (err: any) {
        console.error('Error fetching colab:', err)
        setError(err.message || 'Failed to load colab')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, router])

  const handleCreateContribution = async (description: string) => {
    if (!colab || !description.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('contributions')
      .insert({
        colab_id: colab.id,
        user_id: user.id,
        description,
      })
      .select('*, user:profiles(id, username, full_name, avatar_url)')
      .single()

    if (error) {
      console.error('Error creating contribution:', error)
      return
    }

    setContributions([data, ...contributions])
    setShowContributionModal(false)
  }

  const handleCreateNote = async (content: string) => {
    if (!colab || !content.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('research_notes')
      .insert({
        colab_id: colab.id,
        user_id: user.id,
        content,
      })
      .select('*, user:profiles(id, username, full_name, avatar_url)')
      .single()

    if (error) {
      console.error('Error creating research note:', error)
      return
    }

    setResearchNotes([data, ...researchNotes])
    setShowNoteModal(false)
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: FiHome, color: 'text-blue-600' },
    { id: 'contributions', label: 'Contributions', icon: FiGitBranch, color: 'text-green-600', count: contributions.length },
    { id: 'ai-copilot', label: 'AI Co-Pilot', icon: FiCpu, color: 'text-purple-600' },
    { id: 'compute-sandbox', label: 'Compute Sandbox', icon: FiTerminal, color: 'text-orange-600' },
    { id: 'peer-review', label: 'Peer Review', icon: FiUsers, color: 'text-indigo-600', count: researchNotes.length },
    { id: 'data-vault', label: 'Data Vault', icon: FiDatabase, color: 'text-teal-600' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-slate-600 font-medium">Loading collaboration...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Collaboration</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <Link href="/dashboard" className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-block text-center">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!colab) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiDatabase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaboration Not Found</h3>
          <p className="text-gray-600 mb-4">The collaboration you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                <FiArrowLeft className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Dashboard</span>
              </Link>
              <div className="w-px h-6 bg-slate-300 hidden sm:block"></div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-lg">{colab.name[0]}</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-1">{colab.name}</h1>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500">
                    {colab.is_public ? (
                      <div className="flex items-center gap-1">
                        <FiGlobe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Public</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <FiLock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Private</span>
                      </div>
                    )}
                    <div className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block"></div>
                    <span className="hidden sm:inline">by @{creator?.username || 'unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userRole === 'owner' && (
                <button
                  onClick={() => alert('Create new version (implement modal here)')}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Version</span>
                </button>
              )}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiMenu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row">
        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="sm:hidden fixed inset-0 z-30">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <FiX className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setCurrentSection(section.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 group ${
                        currentSection === section.id
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          currentSection === section.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                          <section.icon className="w-4 h-4" />
                        </div>
                        <span className={`font-medium ${
                          currentSection === section.id ? 'text-slate-900' : 'text-slate-700'
                        }`}>
                          {section.label}
                        </span>
                      </div>
                      {section.count !== undefined && section.count > 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          currentSection === section.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {section.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className="hidden sm:block w-72 bg-white border-r border-slate-200 h-[calc(100vh-81px)] sticky top-[81px] overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 group ${
                    currentSection === section.id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      currentSection === section.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                      <section.icon className="w-4 h-4" />
                    </div>
                    <span className={`font-medium ${
                      currentSection === section.id ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      {section.label}
                    </span>
                  </div>
                  {section.count !== undefined && section.count > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {section.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">
          {currentSection === 'overview' && (
            <OverviewSection colab={colab} creator={creator} userRole={userRole} />
          )}
          {currentSection === 'contributions' && (
            <ContributionsSection
              contributions={contributions}
              userRole={userRole}
              onAddContribution={() => setShowContributionModal(true)}
            />
          )}
          {currentSection === 'ai-copilot' && <AICopilotSection />}
          {currentSection === 'compute-sandbox' && <ComputeSandboxSection />}
          {currentSection === 'peer-review' && (
            <PeerReviewSection
              researchNotes={researchNotes}
              userRole={userRole}
              onAddNote={() => setShowNoteModal(true)}
            />
          )}
          {currentSection === 'data-vault' && <DataVaultSection />}

          {/* Modals */}
          {showContributionModal && (
            <CreateContributionModal
              onClose={() => setShowContributionModal(false)}
              onCreate={handleCreateContribution}
            />
          )}

          {showNoteModal && (
            <CreateResearchNoteModal
              onClose={() => setShowNoteModal(false)}
              onCreate={handleCreateNote}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function OverviewSection({ colab, creator, userRole }: { colab: Colab; creator: Profile | null; userRole: string | null }) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                  colab.is_public 
                    ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                    : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
                }`}>
                  {colab.is_public ? <FiGlobe className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <FiLock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                  {colab.is_public ? 'Public' : 'Private'}
                </span>
                {userRole && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-white/20 text-white border border-white/30">
                    {userRole === 'owner' ? '👑 Owner' : '👥 Member'}
                  </span>
                )}
              </div>
              <p className="text-white/90 text-sm sm:text-lg leading-relaxed max-w-2xl">
                {colab.description || 'A collaborative research project bringing together minds to solve complex problems.'}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Creator & README */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Project Creator</h3>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
              {creator?.avatar_url ? (
                <img src={creator.avatar_url} alt="Creator" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg sm:text-xl">{creator?.full_name?.[0] || 'U'}</span>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{creator?.full_name || 'Unknown User'}</h4>
              <p className="text-slate-600 text-xs sm:text-sm">@{creator?.username || 'unknown'}</p>
              <p className="text-slate-500 text-xs mt-1">{creator?.role || 'Researcher'}</p>
            </div>
          </div>
          {creator?.bio && (
            <p className="text-xs sm:text-sm text-slate-600 mt-3 sm:mt-4 p-2 sm:p-3 bg-slate-50 rounded-lg">{creator.bio}</p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-6 border border-slate-200">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h3 className="text-lg font-semibold text-slate-900">README</h3>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
          <div className="prose prose-sm prose-slate max-w-none">
            {colab.readme ? (
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm sm:text-base">
                {colab.readme}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-slate-500">
                <FiMessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 text-slate-400" />
                <p>No README available yet.</p>
                <p className="text-xs sm:text-sm">Add a README to help collaborators understand your project.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContributionsSection({
  contributions,
  userRole,
  onAddContribution,
}: {
  contributions: Contribution[]
  userRole: string | null
  onAddContribution: () => void
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Contributions</h2>
          <p className="text-slate-600 text-sm sm:text-base">Track progress and collaborate on research milestones</p>
        </div>
        {(userRole === 'owner' || userRole === 'member') && (
          <button
            onClick={onAddContribution}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <FiPlus className="w-4 h-4" />
            <span className="text-sm sm:text-base">Add Contribution</span>
          </button>
        )}
      </div>

      {contributions.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {contributions.map((contribution, index) => (
            <div key={contribution.id} className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:border-green-300 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {contribution.user.avatar_url ? (
                    <img src={contribution.user.avatar_url} alt="Contributor" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{contribution.user.full_name?.[0] || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{contribution.user.full_name || 'Anonymous'}</h4>
                    <span className="text-xs sm:text-sm text-slate-500">@{contribution.user.username}</span>
                    <div className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block"></div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                      <FiCalendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {new Date(contribution.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{contribution.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    #{index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 sm:p-8 md:p-12 border border-slate-200 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FiGitBranch className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1 sm:mb-2">No Contributions Yet</h3>
          <p className="text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
            Be the first to contribute to this collaboration. Share your progress, insights, or milestones.
          </p>
          {(userRole === 'owner' || userRole === 'member') && (
            <button
              onClick={onAddContribution}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <FiPlus className="w-4 h-4" />
              Add First Contribution
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PeerReviewSection({
  researchNotes,
  userRole,
  onAddNote,
}: {
  researchNotes: ResearchNote[]
  userRole: string | null
  onAddNote: () => void
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Peer Review</h2>
          <p className="text-slate-600 text-sm sm:text-base">Share insights, feedback, and collaborative notes</p>
        </div>
        {(userRole === 'owner' || userRole === 'member') && (
          <button
            onClick={onAddNote}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <FiPlus className="w-4 h-4" />
            <span className="text-sm sm:text-base">Add Research Note</span>
          </button>
        )}
      </div>

      {researchNotes.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {researchNotes.map((note, index) => (
            <div key={note.id} className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {note.user.avatar_url ? (
                    <img src={note.user.avatar_url} alt="Author" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{note.user.full_name?.[0] || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{note.user.full_name || 'Anonymous'}</h4>
                    <span className="text-xs sm:text-sm text-slate-500">@{note.user.username}</span>
                    <div className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block"></div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                      <FiCalendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="prose prose-sm prose-slate max-w-none">
                    <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    Note #{index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 sm:p-8 md:p-12 border border-slate-200 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1 sm:mb-2">No Research Notes Yet</h3>
          <p className="text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
            Start the peer review process by sharing your research insights, findings, or questions.
          </p>
          {(userRole === 'owner' || userRole === 'member') && (
            <button
              onClick={onAddNote}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              <FiPlus className="w-4 h-4" />
              Add First Note
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AICopilotSection() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">AI Co-Pilot</h2>
        <p className="text-slate-600 text-sm sm:text-base">Intelligent assistance for your research workflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 sm:p-8 border border-purple-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiCpu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Smart Suggestions</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-3 sm:mb-4">Get AI-powered recommendations for your research direction and methodology.</p>
          <button className="w-full bg-white text-purple-700 px-4 py-2 sm:py-3 rounded-lg hover:bg-purple-50 transition-colors border border-purple-200 font-medium text-sm sm:text-base">
            Coming Soon
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 sm:p-8 border border-green-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiMessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Research Assistant</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-3 sm:mb-4">Chat with an AI assistant trained on your project data and research domain.</p>
          <button className="w-full bg-white text-green-700 px-4 py-2 sm:py-3 rounded-lg hover:bg-green-50 transition-colors border border-green-200 font-medium text-sm sm:text-base">
            Coming Soon
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FiCpu className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">AI Co-Pilot Features</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto">
            Our AI Co-Pilot will provide intelligent assistance throughout your research journey, from ideation to publication.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Literature Review</h4>
              <p className="text-xs sm:text-sm text-slate-600">Automatically discover relevant papers and research</p>
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Data Analysis</h4>
              <p className="text-xs sm:text-sm text-slate-600">Get insights and patterns from your research data</p>
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Writing Support</h4>
              <p className="text-xs sm:text-sm text-slate-600">Improve clarity and structure of research documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComputeSandboxSection() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Compute Sandbox</h2>
        <p className="text-slate-600 text-sm sm:text-base">Execute code, run simulations, and manage computational resources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 sm:p-8 border border-orange-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiTerminal className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Interactive Notebooks</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-3 sm:mb-4">Run Jupyter notebooks with shared compute resources and collaborative editing.</p>
          <button className="w-full bg-white text-orange-700 px-4 py-2 sm:py-3 rounded-lg hover:bg-orange-50 transition-colors border border-orange-200 font-medium text-sm sm:text-base">
            Coming Soon
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiActivity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Resource Monitoring</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-3 sm:mb-4">Track computational usage, performance metrics, and resource allocation.</p>
          <button className="w-full bg-white text-blue-700 px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 font-medium text-sm sm:text-base">
            Coming Soon
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <div className="flex gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
          </div>
          <span className="text-slate-300 font-mono text-xs sm:text-sm">compute-sandbox</span>
        </div>
        <div className="p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <FiTerminal className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Compute Environment</h3>
            <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6">
              Your collaborative compute environment will be available here. Execute code, run experiments, and share results in real-time.
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataVaultSection() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Data Vault</h2>
        <p className="text-slate-600 text-sm sm:text-base">Secure storage and management for your research data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:border-teal-300 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiDatabase className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Datasets</h3>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">24</p>
          <p className="text-xs sm:text-sm text-slate-600">Files stored</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:border-blue-300 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiActivity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Storage Used</h3>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">2.4GB</p>
          <p className="text-xs sm:text-sm text-slate-600">of 10GB limit</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:border-purple-300 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiEye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Access Logs</h3>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">156</p>
          <p className="text-xs sm:text-sm text-slate-600">This month</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 hover:border-green-300 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <FiLock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Security</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mb-1">100%</p>
          <p className="text-xs sm:text-sm text-slate-600">Encrypted</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FiDatabase className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">Secure Data Management</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto">
            Store, organize, and share your research data with enterprise-grade security and collaborative access controls.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
            <div className="p-4 sm:p-6 bg-slate-50 rounded-lg sm:rounded-xl">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <FiLock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">End-to-End Encryption</h4>
              <p className="text-xs sm:text-sm text-slate-600">Your data is encrypted both in transit and at rest</p>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 rounded-lg sm:rounded-xl">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Access Control</h4>
              <p className="text-xs sm:text-sm text-slate-600">Granular permissions for team members and collaborators</p>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 rounded-lg sm:rounded-xl">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <FiActivity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 sm:mb-2">Version Control</h4>
              <p className="text-xs sm:text-sm text-slate-600">Track changes and maintain data lineage</p>
            </div>
          </div>
          <button className="mt-6 sm:mt-8 bg-teal-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-teal-700 transition-colors text-sm sm:text-base">
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateContributionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (description: string) => Promise<void>
}) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setLoading(true)
    try {
      await onCreate(description)
      setDescription('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Add Contribution</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Share your progress or milestone with the team</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[120px] transition-colors text-sm sm:text-base"
                placeholder="Describe your contribution, progress, or milestone..."
                required
              />
            </div>
            <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
              >
                {loading ? 'Adding...' : 'Add Contribution'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreateResearchNoteModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (content: string) => Promise<void>
}) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await onCreate(content)
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Add Research Note</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Share insights, feedback, or observations</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="content" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Note Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px] transition-colors text-sm sm:text-base"
                placeholder="Add your research note, insights, or feedback..."
                required
              />
            </div>
            <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
              >
                {loading ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}