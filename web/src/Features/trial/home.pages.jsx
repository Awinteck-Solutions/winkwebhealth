import { notifications } from "@mantine/notifications";

export const HomePage = () => { 

    notifications.show({
        title: "Adding university program",
        message: "Please wait while we process your request...",
        loading: true,
        duration: 200,
        autoClose: true
    });
    return( <>
        
        <div>
            <p className='bg-red-400 text-white rounded text-xl'>hello</p>
        </div>

    </>)
}