"use client"

import { useRouter } from "expo-router"


import FollowList from "../follow/follow-list"
import { FollowButton } from "../follow/follow-button"
import { useUser } from "@clerk/clerk-expo"
import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { View } from "react-native"

export function UserInfo({ username, isUser, userInfo, isLoading }: { username: string, isUser: boolean, userInfo: any, isLoading: boolean }) {
    const { user } = useUser()
    const router = useRouter()
    const DisplayTextWithBreaks = ({ text }: { text: string }) => {
        return (
            <div
                dangerouslySetInnerHTML={{
                    __html: text.replace(/\n/g, "<br />"), // Convert newlines to <br />
                }}
            />
        )
    }
    const categoryValue =
        typeof userInfo?.category === "string" ? userInfo.category.split(",") : []

    const filteredCategoryCHip = categoryValue.filter((item: any) => item !== "")

    return (
        <View className="w-full">
            <Card
                className="mx-auto rounded-lg  transition-shadow duration-200 hover:shadow-xl "
            >
                <View className="grid grid-cols-4 gap-2">
                    <View className="col-span-4 flex flex-col justify-between ">
                        <View className="grid grid-cols-3 items-center gap-2">
                            {/* user */}
                            <View>
                                <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                                    {/* <User
                                        avatarProps={{
                                            src: userInfo?.profilePic
                                                ? userInfo.profilePic
                                                : user?.imageUrl,
                                        }}
                                        description={
                                            <Link isExternal href={`/user/${username}`} size="md">
                                                @{username}
                                            </Link>
                                        }
                                        name={userInfo?.name}
                                    /> */}
                                    UserIcon and Username    
                                </Skeleton>
                            </View>

                            {/* Followers and Following */}
                            <View className="col-span-3 ml-4 flex justify-center gap-5 text-sm">
                                <View className="flex flex-col items-center">
                                    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                                        <h4 className="text-sm">100</h4>
                                    </Skeleton>
                                    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                                        <h4>Posts</h4>
                                    </Skeleton>
                                </View>


                                <FollowList
                                    username={username}
                                    isLoading={isLoading}
                                    type="follower"
                                />

                                <FollowList
                                    username={username}
                                    isLoading={isLoading}
                                    type="following"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Chips */}
                    <View className="col-span-4 text-sm text-gray-600">
                        <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                            {filteredCategoryCHip && filteredCategoryCHip != "" ? (
                                <View>
                                    {filteredCategoryCHip &&
                                        filteredCategoryCHip.map((category: any, index: any) => (
                                            <Badge
                                                variant="bordered"
                                                key={index}
                                                className="mb-2 mr-2"
                                            >
                                                {category}
                                            </Badge>
                                        ))}
                                </View>
                            ) : null}
                        </Skeleton>
                    </View>

                    {/* Bio */}
                    <View className="col-span-4 text-sm text-gray-600">
                        <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                            {userInfo?.bio && (
                                <DisplayTextWithBreaks text={userInfo?.bio || ""} />
                            )}
                        </Skeleton>
                    </View>

                    {/* Button */}
                    <View className="col-span-4 flex items-center justify-center">
                        <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                            {isUser && userInfo && filteredCategoryCHip ? (
                                // <UserInfoForm
                                //     username={username}
                                //     categoryValue={filteredCategoryCHip}
                                //     userInfo={userInfo}
                                //     isLoading={isLoading}
                                // />
                                <>
                                    User Info Form
                                </>
                            ) : (
                                userInfo &&
                                filteredCategoryCHip && (
                                    <View className="w-full flex gap-2">
                                        <FollowButton
                                            size="md"
                                            username={username}
                                            isUser={isUser}
                                        />
                                        <Button
                                            onPress={() => router.push(`/chatroom/${username}` as any)}
                                            style={{ width: "100%" }}
                                        >
                                            Message
                                        </Button>
                                    </View>
                                )
                            )}
                        </Skeleton>
                    </View>
                </View>
            </Card>
        </View>
    )
}
