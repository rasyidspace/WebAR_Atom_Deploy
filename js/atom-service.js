export class AtomService {
    static async getAtom(id) {
        try {
            const response = await fetch('data/atoms.json');
            const data = await response.json();
            const atom = data.find(item => item.id === id);
            
            if (atom) {
                // Map the marker path based on the atom ID
                const markerMap = {
                    'dalton': 'assets/markers/atom-dalton-marker.mind',
                    'thomson': 'assets/markers/atom-thomson-marker.mind',
                    'penemuan-elektron': 'assets/markers/atom-thomson-marker.mind',
                    'penemuan-inti': 'assets/markers/atom-rutherford-marker.mind',
                    'rutherford': 'assets/markers/atom-rutherford-marker.mind',
                    'bohr': 'assets/markers/atom-nielsbohr-marker.mind',
                    'quantum': 'assets/markers/atom-mekakuantum-marker.mind'
                };
                
                atom.marker = markerMap[atom.id] || `assets/markers/${atom.id}-marker.mind`;
                return atom;
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch atom data:", error);
            return null;
        }
    }
}
