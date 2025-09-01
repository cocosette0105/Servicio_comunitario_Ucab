const API_URL = "http://localhost:5000/api/suggestions";

const fetchSuggestions = async (endpoint: string): Promise<string[]> => {
    try {
        const res = await fetch(`${API_URL}/${endpoint}`);
        if (!res.ok) {
            console.error(`Error fetching ${endpoint}`);
            return [];
        }
        return res.json();
    } catch (error) {
        console.error(`Network error fetching ${endpoint}:`, error);
        return [];
    }
};

export const getArtists = () => fetchSuggestions("artistas");
export const getClassifications = () => fetchSuggestions("clasificaciones");
export const getMaterials = () => fetchSuggestions("materiales");
export const getTechniques = () => fetchSuggestions("tecnicas");
