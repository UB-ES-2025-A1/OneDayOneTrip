import { useNavigate } from "react-router-dom";
import AvatarFallback from "./AvatarFallback";
import "../styles/UserCard.css";

type UserCardProps = {
  uid: string;
  name: string;
  username?: string;
  profilePic?: string;
};

export default function UserCard({ uid, name, username, profilePic }: UserCardProps) {
  const navigate = useNavigate();

  const displayName = name || username || "Usuari anònim";

  return (
    <div className="user-card" onClick={() => navigate(`/user/${uid}`)}>
      <div className="user-card-avatar">
        {profilePic ? (
          <img src={profilePic} alt={displayName} />
        ) : (
          <AvatarFallback name={displayName} />
        )}
      </div>
      
      <div className="user-card-info">
        <h3 className="user-card-name">{displayName}</h3>
        {username && <p className="user-card-username">@{username}</p>}
      </div>
    </div>
  );
}
