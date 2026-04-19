"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const { user, login } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    gender: "",
    location: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      setPageLoading(true)
      const token = localStorage.getItem("access_token")
      try {
        const response = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Failed to fetch user profile.")

        const profileData = await response.json()
        setFormData({
          fullName: profileData.data.fullName || "",
          email: profileData.data.email || "",
          age: profileData.data.age?.toString() || "",
          gender: profileData.data.gender || "",
          location: profileData.data.location || "",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your profile data.",
        })
      } finally {
        setPageLoading(false)
      }
    }

    fetchUserProfile()
  }, [user, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    const token = localStorage.getItem("access_token")
    const refreshToken = localStorage.getItem("refresh_token")

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          age: Number(formData.age) || null,
          gender: formData.gender,
          location: formData.location,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Failed to update profile.")

      const updatedUser = result.data
      if (token && refreshToken) {
        login(updatedUser, token, refreshToken)
      }

      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (pageLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          Update your personal details here.
        </p>
      </header>

      <main>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              This information will be used across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="e.g., 25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleSelectChange("gender", value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Ho Chi Minh City"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8">
      <header>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </header>
      <main>
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-2 h-4 w-full" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
