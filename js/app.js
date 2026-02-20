const { createApp } = Vue;

createApp({

    data() {
        return {
            characters: [],
            search: "",
            sortOrder: "asc",
            selectedCharacter: {}
        }
    },

    computed: {

        filteredCharacters() {

            let result = this.characters;

            if (this.search) {
                result = result.filter(c =>
                    c.title.toLowerCase().includes(this.search.toLowerCase())
                );
            }

            result.sort((a, b) => {
                return this.sortOrder === "asc"
                    ? a.title.localeCompare(b.title)
                    : b.title.localeCompare(a.title);
            });

            return result;
        },

        progressPercentage() {
            if (this.characters.length === 0) return 0;
            return Math.round((this.filteredCharacters.length / this.characters.length) * 100);
        }

    },

    methods: {

        async fetchCharacters() {

            const baseResponse = await fetch(
                "https://maid-dragon.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Characters&cmlimit=100&format=json&origin=*"
            );

            const baseData = await baseResponse.json();
            const pages = baseData.query.categorymembers;

            const titles = pages.map(p => p.title).join("|");

            const detailResponse = await fetch(
                `https://maid-dragon.fandom.com/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(titles)}&pithumbsize=400&format=json&origin=*`
            );

            const detailData = await detailResponse.json();
            const pagesData = detailData.query.pages;

            this.characters = Object.values(pagesData).map(page => ({
                pageid: page.pageid,
                title: page.title,
                image: page.thumbnail ? page.thumbnail.source : null,
                description: ""
            }));
        },

        async openModal(character) {

    let synopsis = "";

    const extractResponse = await fetch(
        `https://maid-dragon.fandom.com/api.php?action=query&prop=extracts&titles=${encodeURIComponent(character.title)}&explaintext=true&format=json&origin=*`
    );

    const extractData = await extractResponse.json();
    const pageData = Object.values(extractData.query.pages)[0];

    if (pageData.extract && pageData.extract.trim().length > 20) {
        synopsis = pageData.extract;
    } else {

        const fullResponse = await fetch(
            `https://maid-dragon.fandom.com/api.php?action=parse&page=${encodeURIComponent(character.title)}&prop=text&format=json&origin=*`
        );

        const fullData = await fullResponse.json();

        if (fullData.parse && fullData.parse.text) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = fullData.parse.text["*"];
            synopsis = tempDiv.innerText.substring(0, 800);
        }
    }

    if (synopsis) {
        const translateResponse = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(synopsis)}`
        );

        const translateData = await translateResponse.json();
        synopsis = translateData[0].map(item => item[0]).join("");
    }

    this.selectedCharacter = {
        ...character,
        description: synopsis || "Sin sinopsis disponible."
    };

    new bootstrap.Modal(this.$refs.modal).show();
}

    },

    mounted() {
        this.fetchCharacters();
    }

}).mount("#app");