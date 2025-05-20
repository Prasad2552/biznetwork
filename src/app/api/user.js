import { auth } from '../../lib/auth'; // Import your auth function
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try{
        await connectToDB()
    }catch(err){
        console.log(err)
        return res.status(500).json({message:'Database connection error'})
    }

    try {
        const session = await auth(req, res); // Use your auth function
        if (!session) {
        // If not authenticated, return a 401 Unauthorized response.
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User.findOne({ email: session?.user?.email });
        console.log(user,"user")
        if(user){
            return res.status(200).json({ username: user.username });
        }else{
            return res.status(400).json({message:'User not found'})
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}