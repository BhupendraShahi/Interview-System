import { EuiFlexGroup, EuiForm, EuiFormRow, EuiSpacer, EuiSwitch } from "@elastic/eui";
import { addDoc } from "firebase/firestore";
import moment from "moment";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import CreateMeetingButtons from "../components/FormComponents/CreateMeetingButtons";
import MeetingDateField from "../components/FormComponents/MeetingDateField";
import MeetingMaximumUsersField from "../components/FormComponents/MeetingMaximumUsersField";
import MeetingNameField from "../components/FormComponents/MeetingNameField";
import MeetingUserField from "../components/FormComponents/MeetingUserField";
import Header from "../components/Header";
import useAuth from "../hooks/useAuth";
import useFetchUsers from "../hooks/useFetchUsers";
import useToast from "../hooks/useToast";
import { meetingsRef } from "../utils/firebaseConfig";
import { generateMeetingID } from "../utils/generateMeetingId";
import { FieldErrorType, UserType } from "../utils/types";

function VideoConference() {
  useAuth();
  const navigate = useNavigate();
  const [users] = useFetchUsers();
  const [createToast] = useToast();

  const uid = useAppSelector((interview) => interview.auth.userInfo?.uid);
  const [meetingName, setMeetingName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Array<UserType>>([]);
  const [size, setSize] = useState(1);
  const [anyoneCanJoin, setAnyoneCanJoin] = useState(false);
  const [startDate, setStartDate] = useState(moment());
  const [showErrors, setShowErrors] = useState<{
    meetingName: FieldErrorType;
    meetingUser: FieldErrorType;
  }>({
    meetingName: {
      show: false,
      message: [],
    },
    meetingUser: {
      show: false,
      message: [],
    },
  });

  const onUserChange = (selectedOptions: any) => {
    setSelectedUsers(selectedOptions);
  };

  const validateForm = () => {
    let errors = false;
    const clonedShowErrors = { ...showErrors };
    if (!meetingName.length) {
      clonedShowErrors.meetingName.show = true;
      clonedShowErrors.meetingName.message = ["Please Enter Meeting Name"];
      errors = true;
    } else {
      clonedShowErrors.meetingName.show = false;
      clonedShowErrors.meetingName.message = [];
    }

    if (!selectedUsers.length) {
      clonedShowErrors.meetingUser.show = true;
      clonedShowErrors.meetingUser.message = ["Please Select a user."];
      errors = true;
    } else {
      clonedShowErrors.meetingUser.show = false;
      clonedShowErrors.meetingUser.message = [];
    }

    setShowErrors(clonedShowErrors);
    return errors;
  };

  const createMeeting = async () => {
    if (!validateForm()) {
      const meetingId = generateMeetingID();
      await addDoc(meetingsRef, {
        createdBy: uid,
        meetingId,
        meetingName,
        meetingType: anyoneCanJoin ? "anyone-can-join" : "video-conference",
        invitedUsers: anyoneCanJoin
          ? []
          : selectedUsers.map((user: UserType) => user.uid),
        meetingDate: startDate.format("L"),
        maxUsers: anyoneCanJoin ? 50 : size,
        status: true,
      });
      createToast({
        title: anyoneCanJoin
          ? "Anyone can join meeting created successfully!"
          : "Video Conference created successfully!",
        type: "success",
      });
      navigate("/");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <Header />
      <EuiFlexGroup justifyContent="center" alignItems="center">
        <EuiForm>
          <EuiFormRow display="columnCompressedSwitch" label="Anyone can Join">
            <EuiSwitch
              showLabel={false}
              label="Anyone Can Join"
              checked={anyoneCanJoin}
              onChange={(e) => setAnyoneCanJoin(e.target.checked)}
              compressed
            />
          </EuiFormRow>
          <MeetingNameField
            label="Meeting Name"
            placeholder="Meeting Name"
            value={meetingName}
            setMeetingName={setMeetingName}
            isInvalid={showErrors.meetingName.show}
            error={showErrors.meetingName.message}
          />
          {anyoneCanJoin ? (
            <MeetingMaximumUsersField value={size} setSize={setSize} />
          ) : (
          <MeetingUserField
            label="Invite USer"
            options={users}
            onChange={onUserChange}
            selectedOptions={selectedUsers}
            singleSelection={false}
            isClearable={false}
            placeholder="Select a user"
            isInvalid={showErrors.meetingUser.show}
            error={showErrors.meetingUser.message}
          />
          )}
          <MeetingDateField selected={startDate} setStartDate={setStartDate} />
          <EuiSpacer />
          <CreateMeetingButtons createMeeting={createMeeting} />
        </EuiForm>
      </EuiFlexGroup>
    </div>
  );
}

export default VideoConference;
