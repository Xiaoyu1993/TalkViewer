//jQuery
$("document").ready(function() {
    //submit click function
    $("#button").click(function(){
        var text = $("#text-input").val();
        if(text != null){
            //send data to the server
            var data = {};
            data['str'] = text
            console.log(data)
            
            // Flask style post
            $.post("/request", data, function(data,status){
                //alert('flask post');
                $("#tripleResult").text(data.sent);
            },"json");

            // Ajax style post
            /*$.ajax({
                type: 'POST',
                url: "/request",
                data: data,
                dataType: 'json', 
                success: function(data) { 
                    //alert('ajax post');
                    console.log(data);
                    $("#onto").text(data.sent);
                },
                error: function(xhr, type) {
                    alert(xhr.responseText);
                    alert(type);
                }
            });*/

        }else
        {
            alert('Please enter a sentence');
        }
    });

    $('#chooseSen a').on('click', function(){
        $("#text-input").val($(this).text());
    });

    //submit click function
    $("#button-submit").click(function(){
        var text = $("#text-input").val();
        if(text != null){
            //send data to the server
            var data = {};
            data['type'] = "sent"
            data['str'] = text
            console.log(data)
            
            // Flask style post
            $.post("/request", data, function(options,status){
                //alert('flask post');
                index = 0;
                data = options[index];
                //console.log(data)
                selections = []
                $("#label0").text("0: " + data[0].slice(29,-1));
                $("#label1").text("1: " + data[1].slice(29,-1));
                $("#label2").text("2: " + data[2].slice(29,-1));
                $("#label3").text("3: " + data[3].slice(29,-1));
                $("#label4").text("4: " + data[4].slice(29,-1));
                $('input[name="options"]').click( function() {
                    if (data && data.length){//for second round selection
                        if(index < 2){
                            value = $(this).val();
                            if(value >= -1 && value <= 4){
                                console.log(value)
                                selections.push(data[value]);
                                console.log(selections)
                                index += 1;
                            }else
                            {
                                alert('Please select a word/phrase');
                            }
                        
                            data = options[index];
                            console.log(data)
                            if(data.length > 0){//may not have complete object-predicate-subject every time
                                $("#label0").text("0: " + data[0].slice(29,-1));
                                $("#label1").text("1: " + data[1].slice(29,-1));
                                $("#label2").text("2: " + data[2].slice(29,-1));
                                $("#label3").text("3: " + data[3].slice(29,-1));
                                $("#label4").text("4: " + data[4].slice(29,-1));
                            }else{
                                index += 1;
                            }
                            
                        }else{
                            value = $(this).val();
                            if(value >= -1 && value <= 4){
                                console.log(value)
                                selections.push(data[value]);
                                console.log(selections)
                                index += 1;
                            }else
                            {
                                alert('Please select a word/phrase');
                            }
                            //console.log(selections)
                            data = {};
                            data['type'] = "select"
                            data['str'] = JSON.stringify(selections)
                            console.log(data)
                
                            // Flask style post
                            $.post("/request", data, function(result,status){
                                //alert('flask post');
                                console.log(result)
                                $("#tripleResult").text(JSON.stringify(result));
                            },"json");
                        }
                    }
                });
                //});
                /*$("#tripleResult").text(data);
                $("#label0").text("0: " + data[0]);
                $("#label1").text("1: " + data[1]);
                $("#label2").text("2: " + data[2]);
                $("#label3").text("3: " + data[3]);
                $("#label4").text("4: " + data[4]);*/
            },"json");   
        }else
        {
            alert('Please enter a sentence');
        }
    });

    /*$('input[name="options"]').change( function() {
        value = $(this).val();
        if(value >= -1 && value <= 4){
            //send data to the server
            var data = {};
            data['type'] = "select"
            data['int'] = value.toString()
            console.log(data)
            
            // Flask style post
            $.post("/request", data, function(data,status){
                alert('flask post');
                /*index = 0
                $("#tripleResult").text(data);
                $("#label0").text("0: " + data[0]);
                $("#label1").text("1: " + data[1]);
                $("#label2").text("2: " + data[2]);
                $("#label3").text("3: " + data[3]);
                $("#label4").text("4: " + data[4]);
            },"json");

        }else
        {
            alert('Please select a word/phrase');
        }
    });*/
});

Vue.component('product', {
    props: {
        premium: {
            type: Boolean,
            required: true
        }
    },
    template:`
    <div class="input">
        <!--div class="product-image">
            <img v-bind:src="image">
        </div>

        <div class="product-info">
            <h1>{{ title }}</h1>
            <p v-if="inStock">In Stock</p>
            <p v-else :class="{outOfStock: !inStock}">Out of Stock</p>
            <p v-show="onSale">{{sale}}</p>
            <p>Shipping: {{shipping}}</p>

            <ul>
                <li v-for="detail in details">{{detail}}</li>
            </ul>

            <div v-for="(variant, index) in variants" 
                :key="variant.variantId"
                class="color-box"
                :style="{ backgroundColor: variant.variantColor}"
                @mouseover="updateProduct(index)">
            </div>

            <button @click="addToCart" 
                    :discabled="!inStock"
                    :class="{disabledButton: !inStock}">
                Add To Cart
            </button>
            <button @click="removeFromCart" 
                    :discabled="!inStock"
                    :class="{disabledButton: !inStock}">
                Remove
            </button>
        </div>

        <div>
            <h2>Reviews</h2>
            <p v-if="!reviews.length">There are no reviews yet.</p>
            <ul>
                <li v-for="review in reviews">
                    <p> {{ review.name }} </p>
                    <p> Rating: {{ review.rating }} </p>
                    <p> {{ review.review }} </p>
                    <p v-if="review.recommend=='yes'"> I will recommend this product :) </p>
                    <p v-else> I won't recommend this product :( </p>
                </li>
            </ul>
        </div-->

        <div style="width: 100%;">
            <input-box @review-submitted="addReview"></input-box>
        </div>

        <div id="tri" class="triple">
            <label for="tri"> Triple Result </label>
            <p/>
            <textarea id="tripleResult" style="height: 100%; padding: 20px;"> print triple here! </textarea>
        </div>
       
    </div>
    `,
    data(){
        return {
            brand: 'Vue Mastery',
            product: 'Socks',
            selectedVariant: 0,
            onSale: true,
            details: ["80% cotton", "20% polyester", "Gender-neutral"],
            variants: [
                {
                    variantId: 2234,
                    variantColor: "green",
                    variantImage: './assets/vmSocks-green.png',
                    variantQuantity: 8
                },
                {
                    variantId: 2235,
                    variantColor: "blue",
                    variantImage: './assets/vmSocks-blue.png',
                    variantQuantity: 2
                }
            ],
            reviews: []
        }
    },
    methods: {
        addToCart() {
            this.$emit('add-to-cart', this.variants[this.selectedVariant].variantId)
        },
        removeFromCart() {
            this.$emit('remove-from-cart', this.variants[this.selectedVariant].variantId)
            //if(this.cart.length > 0)
            //    this.cart -= 1
        },
        updateProduct(index){
            this.selectedVariant = index
            console.log(index)
        },
        addReview(productReview){
            this.reviews.push(productReview)
        }
    },
    computed: {//callback functions: methods that can be called like properties
        title(){ 
            return this.brand + ' ' + this.product
        },
        image(){
            return this.variants[this.selectedVariant].variantImage
        },
        inStock(){
            return this.variants[this.selectedVariant].variantQuantity > 0
        },
        sale(){
            if(this.onSale)
                return this.brand + ' ' + this.product + ' is on sale!'
        },
        shipping(){
            if(this.premium)
                return 'free'
            else
                return '$2.99'
        }
    }
})

Vue.component('input-box', {
    template:`
    <form class="input-box" @submit.prevent="onSubmit">
        <p v-if="errors.length">
            <b>Please correct the following error(s):</b>
            <ul>
                <li v-for="error in errors">{{error}}</li>
            </ul>
        </p>

        <!--p>
            <label for="name">Name:</label>
            <input id="name" v-model="name"> 
        </p-->
        
        <!--div class="dropdown">
            <label for="chooseSen">Enter text or</label>
            <button id="dropdownBtn" class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Choose here
            </button>
            <div id="chooseSen" class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                <a class="dropdown-item" href="#"> Nurses are females. </a>
                <a class="dropdown-item" href="#"> Businessman is a person. </a>
                <a class="dropdown-item" href="#"> I am a Purdue graduate. </a>
            </div>
        </div>

        <p>
            <label> Sentence </label>
            <textarea id = "text-input" v-model="typeSent"></textarea>
        </p>
        
        <p>
            <button type="submit" class="button" id = "button-submit"> Run </button>
        </p-->

        <p>
            <label> Other alternatives of this entity: </label>
            <div class="form-check">
                <input id="radio0" class="form-check-input" type="radio" v-model="chooseSent" name="options" id="option0" value="0">
                <label id="label0" class="form-check-label" for="option0">
                    {{candiSent[0]}}
                </label>
            </div>
            <div class="form-check">
                <input id="radio1" class="form-check-input" type="radio" v-model="chooseSent" name="options" id="option1" value="1">
                <label id="label1" class="form-check-label" for="option1">
                    {{candiSent[1]}}
                </label>
            </div>
            <div class="form-check">
                <input id="radio2" class="form-check-input" type="radio" v-model="chooseSent" name="options" id="option2" value="2">
                <label id="label2" class="form-check-label" for="option2">
                    {{candiSent[2]}}
                </label>
            </div>
            <div class="form-check">
                <input id="radio3" class="form-check-input" type="radio" v-model="chooseSent" name="options" id="option3" value="3">
                <label id="label3" class="form-check-label" for="option3">
                    {{candiSent[3]}}
                </label>
            </div>
            <div class="form-check">
                <input id="radio4" class="form-check-input" type="radio" v-model="chooseSent" name="options" id="option4" value="4">
                <label id="label4" class="form-check-label" for="option4">
                    {{candiSent[4]}}
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" v-model="chooseSent" name="options" id="option5" value="-1">
                <label class="form-check-label" for="option5">
                    Nothing seems correct
                </label>
            </div>
        </p>
    </form>
    `,
    data(){
        return {
            typeSent: null,
            chooseSent: -2,
            candiSent: ["0: Business", "1: Businessperson", "2: Business magnate", "3: Petroleum industry", "4: Small business"],
            errors: []
        }
    },
    methods:{
        onSubmit(){
            if (this.typeSent || this.chooseSent>-2){
                //create a new object named productReview
                let inputSent = {
                    typeSent: this.typeSent,
                    chooseSent: this.chooseSent
                }

                if(this.typeSent){
                    let inputSent = {
                        sentence: this.typeSent,
                        chooseSent: this.chooseSent,
                        name: "",
                        rating: 0,
                        review: "",
                        recommend: false
                    }
                }else if(this.chooseSent>-2){
                    let inputSent = {
                        typeSent: this.typeSent,
                        chooseSent: this.chooseSent,
                        name: "",
                        rating: 0,
                        review: "",
                        recommend: false
                    }
                }

                // send the productReview to parent object product
                this.$emit('review-submitted', inputSent)

                //reset the content of input box
                this.typeSent = null
                this.chooseSent = null
            }
            else{
                //this.errors.push("Please type or choose a test sentence.")
            }
        }
    }
})

var app = new Vue({
    el: '#app',   
    data: {
        premium: false,
        //cart: []
    },
    methods: {
        addToCart(id){
            this.cart.push(id)
        },
        removeFromCart(id){
            this.cart = this.cart.filter(function(item) {
                return item !== id
              })
        }
    }
})
