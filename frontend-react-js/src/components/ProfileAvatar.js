import './ProfileAvatar.css';

export default function ProfileAvatar(props) {
  const backgroundImage = `url("https://assets.roopish-awssolutions.com/avatars/${props.id}.jpg")`
   
  // console.log("ProfileAvatar", props)
   //console.log(backgroundImage)
  const styles = {
    backgroundImage: backgroundImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div 
      className="profile-avatar"
      style={styles}
    ></div>
  );
}

