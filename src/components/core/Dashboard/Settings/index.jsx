import React from "react";
import UpdatePassword from "./UpdatePassword";
import DeleteAccount from "./DeleteAccount";
import EditProfile from "./EditProfile";
import ChangeProfilePicture from "./ChangeProfilePicture";

const Settings = () => {
    return (
        
    <>
      <h1 className="mb-14 text-3xl font-medium text-richblack-5">
        Edit Profile
      </h1>
      {/* Change Profile Picture */}
      <ChangeProfilePicture />
      {/* Profile */}
      <EditProfile />
      {/* Password */}
      <UpdatePassword />
      {/* Delete Account */}
      <DeleteAccount />
    </>
    )
}

export default Settings