import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      role, phone, bio, brokerageName, brokerageWebsite, brokeragePhone,
      boroughsServed, specialties, yearsOfExperience, hasLicenses, licenses,
      linkedinUrl, instagramUrl, twitterUrl, facebookUrl, tiktokUrl,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (role && (role === "USER" || role === "BROKER")) {
      updateData.role = role;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = stripHtml(bio);

    // Broker / Advisor fields
    if (brokerageName !== undefined) updateData.brokerageName = brokerageName;
    if (brokerageWebsite !== undefined) updateData.brokerageWebsite = brokerageWebsite;
    if (brokeragePhone !== undefined) updateData.brokeragePhone = brokeragePhone;
    if (Array.isArray(boroughsServed)) updateData.boroughsServed = boroughsServed;
    if (Array.isArray(specialties)) updateData.specialties = specialties;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = typeof yearsOfExperience === "number" ? yearsOfExperience : parseInt(yearsOfExperience, 10) || null;
    if (hasLicenses !== undefined) updateData.hasLicenses = !!hasLicenses;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl;
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl;
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
    if (tiktokUrl !== undefined) updateData.tiktokUrl = tiktokUrl;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        bio: true,
        brokerageName: true,
        boroughsServed: true,
        specialties: true,
        hasLicenses: true,
        avatarUrl: true,
        linkedinUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
      },
    });

    // Create license records if provided
    if (hasLicenses && Array.isArray(licenses) && licenses.length > 0) {
      for (const license of licenses) {
        if (license.name && typeof license.name === "string") {
          await prisma.license.create({
            data: {
              userId: session.user.id,
              name: license.name,
              licenseNumber: license.licenseNumber || null,
            },
          });
        }
      }
    }

    // Calculate and update profile completeness
    const completeness = calculateProfileCompleteness(updatedUser);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileCompleteness: completeness },
    });

    return NextResponse.json({
      success: true,
      data: { ...updatedUser, profileCompleteness: completeness },
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
